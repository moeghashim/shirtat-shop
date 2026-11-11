import {
  emptyLiveCardsPlan,
  finishLiveCards,
  isLiveCardsResponse,
  liveCardsRequest,
  noteShopperText,
  resetLiveCardsUtterance,
  tickLiveCards,
  type LiveCardsPlan,
  type VoiceToolView,
} from "./index";

export type VoiceFailure = "daily_cap" | "denied" | "duration" | "rate_limited" | "unavailable";

interface VoiceHandlers {
  onActivity: (activity: "listening" | "speaking") => void;
  onAssistant: (text: string) => void;
  onFailure: (code: VoiceFailure) => void;
  onShopper: (text: string, final: boolean) => void;
  onTool: (view: VoiceToolView) => void;
  onUtterance: () => void;
}

export interface VoiceConnection {
  say(text: string): void;
  stop(): void;
}

interface TrackedResponse {
  closed: boolean;
  continued: boolean;
  generation: number;
  live: boolean;
  transcript: string;
}

interface TrackedCall {
  arguments: string;
  callId: string;
  done: boolean;
  name: string;
  output?: string;
}

export async function connectVoice(
  locale: "ar" | "en",
  handlers: VoiceHandlers,
  audio: HTMLAudioElement,
): Promise<VoiceConnection> {
  if (!navigator.mediaDevices?.getUserMedia) throw failure("denied");
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
  } catch (error) {
    const name = error instanceof DOMException ? error.name : "";
    throw failure(
      name === "NotAllowedError" || name === "NotFoundError" ? "denied" : "unavailable",
    );
  }

  let token: { maxSeconds: number; sessionId: string; value: string };
  try {
    token = await mint(locale);
  } catch (error) {
    stopStream(stream);
    throw error;
  }

  const peer = new RTCPeerConnection();
  const channel = peer.createDataChannel("oai-events");
  peer.addTrack(stream.getTracks()[0]);
  peer.ontrack = (event) => {
    audio.srcObject = event.streams[0] ?? null;
    void audio.play().catch(() => undefined);
  };
  try {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await gatherIce(peer);
    const sdp = peer.localDescription?.sdp;
    if (!sdp) throw failure("unavailable");
    const answer = await fetch("https://api.openai.com/v1/realtime/calls", {
      body: sdp,
      headers: { authorization: `Bearer ${token.value}`, "content-type": "application/sdp" },
      method: "POST",
    });
    if (!answer.ok) throw failure("unavailable");
    await peer.setRemoteDescription({ sdp: await answer.text(), type: "answer" });
  } catch (error) {
    cleanup();
    throw error instanceof Error && "code" in error ? error : failure("unavailable");
  }

  let plan: LiveCardsPlan = emptyLiveCardsPlan();
  let shopper = "";
  let assistant = "";
  let shopperFinal = false;
  let applied = 0;
  let generation = 0;
  let stopped = false;
  let quietTimer = 0;
  const startedAt = Date.now();
  const responses = new Map<string, TrackedResponse>();
  const calls = new Map<string, TrackedCall[]>();
  const roundsByGeneration = new Map<number, number>();
  const seenCalls = new Set<string>();
  const durationTimer = window.setTimeout(() => {
    handlers.onFailure("duration");
    finish();
  }, token.maxSeconds * 1000);

  channel.onopen = () => handlers.onActivity("listening");
  channel.onmessage = (event) => {
    if (typeof event.data !== "string") return;
    let message: Record<string, unknown>;
    try {
      const parsed = JSON.parse(event.data) as unknown;
      if (!parsed || typeof parsed !== "object") return;
      message = parsed as Record<string, unknown>;
    } catch {
      return;
    }
    handleEvent(message);
  };
  audio.onplaying = () => handlers.onActivity("speaking");
  audio.onpause = () => handlers.onActivity("listening");

  function handleEvent(message: Record<string, unknown>) {
    const type = typeof message.type === "string" ? message.type : "";
    if (type === "input_audio_buffer.speech_started") {
      if (shopperFinal) {
        handlers.onUtterance();
        shopper = "";
        assistant = "";
        shopperFinal = false;
        plan = emptyLiveCardsPlan();
      }
      handlers.onActivity("listening");
      return;
    }
    if (type === "input_audio_buffer.speech_stopped") {
      shopperFinal = true;
      handlers.onShopper(shopper, true);
      plan = { ...resetLiveCardsUtterance(plan), lastSent: shopper.trim() };
      return;
    }
    if (type.includes("input_audio_transcription") && type.endsWith(".delta")) {
      const delta = typeof message.delta === "string" ? message.delta : "";
      if (!delta) return;
      shopper += delta;
      handlers.onShopper(shopper, false);
      plan = noteShopperText(plan, shopper, Date.now());
      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(sendPendingCards, 200);
      return;
    }
    if (
      type.includes("input_audio_transcription") &&
      (type.endsWith(".completed") || type.endsWith(".done"))
    ) {
      if (typeof message.transcript === "string") shopper = message.transcript.trim();
      shopperFinal = true;
      handlers.onShopper(shopper, true);
      return;
    }
    if (type === "response.created") {
      const response = record(message.response);
      if (!response?.live) handlers.onActivity("speaking");
      return;
    }
    if (
      type.includes("output_audio_transcript") &&
      type.endsWith(".delta") &&
      typeof message.delta === "string"
    ) {
      const tracked = responses.get(stringField(message, "response_id"));
      if (tracked?.live) return;
      assistant += message.delta;
      handlers.onAssistant(assistant);
      handlers.onActivity("speaking");
      return;
    }
    if (type === "output_audio_buffer.started") handlers.onActivity("speaking");
    if (type === "output_audio_buffer.stopped") handlers.onActivity("listening");
    if (type === "response.done") {
      const id = responseId(message);
      const tracked = responses.get(id);
      if (tracked) tracked.closed = true;
      if (tracked && !tracked.live) handlers.onActivity("listening");
      maybeContinue(id);
      return;
    }
    const call = functionCall(message);
    if (!call || seenCalls.has(call.callId)) return;
    seenCalls.add(call.callId);
    const tracked = responses.get(call.responseId);
    const list = calls.get(call.responseId) ?? [];
    const entry: TrackedCall = { ...call, done: false };
    list.push(entry);
    calls.set(call.responseId, list);
    void runCall(entry, tracked?.generation ?? generation).finally(() =>
      maybeContinue(call.responseId),
    );
  }

  function record(value: unknown) {
    if (!value || typeof value !== "object") return null;
    const id = "id" in value && typeof value.id === "string" ? value.id : "";
    if (!id || responses.has(id)) return responses.get(id) ?? null;
    const metadata = "metadata" in value ? value.metadata : undefined;
    const live = isLiveCardsResponse(metadata);
    const fromMetadata =
      metadata &&
      typeof metadata === "object" &&
      "generation" in metadata &&
      typeof metadata.generation === "string"
        ? Number(metadata.generation)
        : Number.NaN;
    const nextGeneration = Number.isInteger(fromMetadata) ? fromMetadata : ++generation;
    if (!live && !Number.isInteger(fromMetadata)) generation = Math.max(generation, nextGeneration);
    const tracked = {
      closed: false,
      continued: false,
      generation: nextGeneration,
      live,
      transcript: shopper.trim(),
    };
    responses.set(id, tracked);
    return tracked;
  }

  async function runCall(call: TrackedCall, callGeneration: number) {
    try {
      const response = await fetch("/api/agent/voice", {
        body: JSON.stringify({
          arguments: parseArguments(call.arguments),
          callId: call.callId,
          kind: "tool",
          locale,
          name: call.name,
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      if (!response.ok) {
        call.output = JSON.stringify({ error: "That action failed." });
        return;
      }
      const result = (await response.json()) as { model?: unknown; view?: VoiceToolView };
      call.output = JSON.stringify(result.model ?? { error: "That action failed." }).slice(
        0,
        12_000,
      );
      if (result.view && callGeneration >= applied) {
        applied = callGeneration;
        handlers.onTool(result.view);
      }
    } catch {
      call.output = JSON.stringify({ error: "That action failed." });
    } finally {
      call.done = true;
    }
  }

  function maybeContinue(id: string) {
    const tracked = responses.get(id);
    const list = calls.get(id) ?? [];
    if (!tracked?.closed || list.some((call) => !call.done)) return;
    if (!list.length) {
      if (tracked.live) releaseLive();
      return;
    }
    if (tracked.continued) return;
    tracked.continued = true;
    const rounds = (roundsByGeneration.get(tracked.generation) ?? 0) + 1;
    if (tracked.live && rounds > 2) {
      releaseLive();
      return;
    }
    roundsByGeneration.set(tracked.generation, rounds);
    if (tracked.live) {
      send({
        response: {
          conversation: "none",
          input: [
            {
              content: [{ text: tracked.transcript, type: "input_text" }],
              role: "user",
              type: "message",
            },
            ...list.flatMap((call) => [
              {
                arguments: call.arguments,
                call_id: call.callId,
                name: call.name,
                type: "function_call",
              },
              { call_id: call.callId, output: call.output ?? "{}", type: "function_call_output" },
            ]),
          ],
          metadata: { generation: String(tracked.generation), purpose: "live-cards" },
          output_modalities: ["text"],
          tool_choice: rounds >= 2 ? "none" : "auto",
        },
        type: "response.create",
      });
      return;
    }
    for (const call of list) {
      send({
        item: { call_id: call.callId, output: call.output ?? "{}", type: "function_call_output" },
        type: "conversation.item.create",
      });
    }
    send({ response: { output_modalities: ["audio"] }, type: "response.create" });
  }

  function sendPendingCards() {
    const ticked = tickLiveCards(plan, Date.now());
    plan = ticked.plan;
    if (!ticked.send || channel.readyState !== "open") {
      if (ticked.send) plan = finishLiveCards(plan);
      return;
    }
    generation += 1;
    const request = liveCardsRequest(ticked.send, locale);
    send({
      ...request,
      response: {
        ...request.response,
        metadata: { generation: String(generation), purpose: "live-cards" },
      },
    });
  }

  function releaseLive() {
    plan = finishLiveCards(plan);
    sendPendingCards();
  }

  function send(event: unknown) {
    if (channel.readyState !== "open") return;
    channel.send(JSON.stringify(event));
  }

  function say(text: string) {
    send({
      item: {
        content: [{ text, type: "input_text" }],
        role: "user",
        type: "message",
      },
      type: "conversation.item.create",
    });
    send({ response: { output_modalities: ["audio"] }, type: "response.create" });
  }

  function finish() {
    if (stopped) return;
    stopped = true;
    window.clearTimeout(durationTimer);
    window.clearTimeout(quietTimer);
    const seconds = Math.min(token.maxSeconds, Math.ceil((Date.now() - startedAt) / 1000));
    void fetch("/api/agent/voice", {
      body: JSON.stringify({
        assistant,
        kind: "settle",
        seconds,
        sessionId: token.sessionId,
        shopper,
      }),
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
    cleanup();
  }

  function cleanup() {
    channel.close();
    peer.close();
    audio.pause();
    audio.srcObject = null;
    stopStream(stream);
  }

  return { say, stop: finish };
}

async function mint(locale: "ar" | "en") {
  const response = await fetch("/api/agent/voice", {
    body: JSON.stringify({ kind: "mint", locale }),
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const data = (await response.json().catch(() => null)) as {
    code?: string;
    maxSeconds?: number;
    sessionId?: string;
    value?: string;
  } | null;
  if (!response.ok || !data?.value || !data.sessionId)
    throw failure(
      data?.code === "daily_cap" || data?.code === "rate_limited" ? data.code : "unavailable",
    );
  return { maxSeconds: data.maxSeconds ?? 300, sessionId: data.sessionId, value: data.value };
}

function functionCall(message: Record<string, unknown>) {
  const type = typeof message.type === "string" ? message.type : "";
  if (type === "response.function_call_arguments.done") return callFrom(message, message);
  if (type === "response.output_item.done") {
    const item = message.item;
    if (!item || typeof item !== "object" || !("type" in item) || item.type !== "function_call")
      return null;
    return callFrom(message, item as Record<string, unknown>);
  }
  return null;
}

function callFrom(message: Record<string, unknown>, source: Record<string, unknown>) {
  const name = stringField(source, "name");
  const callId = stringField(source, "call_id");
  const args = typeof source.arguments === "string" ? source.arguments : "";
  const response = stringField(message, "response_id") || stringField(source, "response_id");
  if (!name || !callId) return null;
  return { arguments: args, callId, name, responseId: response };
}

function responseId(message: Record<string, unknown>) {
  const response = message.response;
  if (
    response &&
    typeof response === "object" &&
    "id" in response &&
    typeof response.id === "string"
  )
    return response.id;
  return stringField(message, "response_id");
}

function stringField(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" ? field : "";
}

function parseArguments(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return {};
  }
}

function gatherIce(peer: RTCPeerConnection) {
  return new Promise<void>((resolve) => {
    if (peer.iceGatheringState === "complete") return resolve();
    const timer = window.setTimeout(resolve, 1000);
    peer.onicegatheringstatechange = () => {
      if (peer.iceGatheringState !== "complete") return;
      window.clearTimeout(timer);
      resolve();
    };
  });
}

function stopStream(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}

function failure(code: VoiceFailure): Error & { code: VoiceFailure } {
  return Object.assign(new Error(code), { code });
}
