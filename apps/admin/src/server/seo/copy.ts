export type SeoChecklistLocale = "en" | "ar";

const copy = {
  blocked: { ar: "بانتظار الموافقة", en: "Blocked on approval" },
  checkedAll: { ar: "كل المهام", en: "All tasks" },
  checkedDone: { ar: "تم", en: "Done" },
  checkedFilter: { ar: "الإنجاز", en: "Checklist" },
  checkedOpen: { ar: "غير منجز", en: "Not done" },
  emptyTasks: { ar: "لا مهام تطابق هذه التصفية.", en: "No tasks match these filters." },
  forbidden: { ar: "المالك وحده يستطيع تحديث فحص المهمة.", en: "Only the owner can update a task check." },
  inProgress: { ar: "قيد التنفيذ", en: "In progress" },
  needsApproval: { ar: "يحتاج موافقة", en: "Needs approval" },
  notStarted: { ar: "لم تبدأ", en: "Not started" },
  noticeMissing: {
    ar: "حفظ القائمة متوقف حتى تُطبَّق ترحيلة seo_task_check. هذه الحالات من الخطة.",
    en: "Checklist saving is off until the seo_task_check migration is applied. These statuses are from the plan.",
  },
  openLink: { ar: "فتح", en: "Open" },
  ownerBot: { ar: "البوت", en: "Bot" },
  ownerMoe: { ar: "مو", en: "Moe" },
  pageDemo: {
    ar: "حالات المهام من الخطة. حفظ العلامة متاح للمالك بعد ربط قاعدة البيانات.",
    en: "Task statuses come from the plan. Checking them off is saved for the signed-in owner once the database is connected.",
  },
  pageMissing: {
    ar: "حالات المهام من الخطة إلى أن يصبح حفظ القائمة متاحًا.",
    en: "Task statuses come from the plan until checklist saving is available.",
  },
  pageReady: {
    ar: "علّم المهمة عند إنجازها. الفحص المحفوظ يستبدل حالة الخطة، والتقدّم يُحسب بالطريقة نفسها.",
    en: "Tick a task when it is finished. A saved check replaces that task's plan status. Progress counts the same way.",
  },
  progressDescription: {
    ar: "بلا تصفية. العدد يستخدم الفحص المحفوظ إن وُجد، وإلا حالة الخطة.",
    en: "Unfiltered. Counts use a saved check when one exists, and the plan status otherwise.",
  },
  saveFailed: {
    ar: "لم يُحفظ هذا الفحص. عادت القائمة إلى آخر حالة محفوظة.",
    en: "That check was not saved. The list is back to the last saved status.",
  },
  tasksDescription: {
    ar: "مصفّاة حسب المرحلة والمجال والحالة والمالك والإنجاز. نافذة التاريخ لا تغيّر هذه القائمة.",
    en: "Filtered by phase, area, status, owner and checklist. The date window does not change this list.",
  },
  unavailable: {
    ar: "حفظ القائمة متوقف حتى تُرحَّل جدول فحوص المهام.",
    en: "Checklist saving is off until the task-check table is migrated.",
  },
  unknownTask: { ar: "هذه المهمة ليست في الخطة.", en: "That task is not in the plan." },
} as const;

export type SeoCopyKey = keyof typeof copy;

export function seoText(key: SeoCopyKey, locale: SeoChecklistLocale): string {
  return copy[key][locale];
}

export function formatCheckDate(value: Date, locale: SeoChecklistLocale): string {
  const formatted = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(value);
  return `${formatted} UTC`;
}

export function checkedByLine(locale: SeoChecklistLocale, name: string | null, when: string | null): string {
  if (locale === "ar") {
    if (name && when) return `أتمّها ${name} · ${when}`;
    if (name) return `أتمّها ${name}`;
    if (when) return `تم · ${when}`;
    return "تم";
  }
  if (name && when) return `Checked by ${name} · ${when}`;
  if (name) return `Checked by ${name}`;
  if (when) return `Checked · ${when}`;
  return "Checked";
}

export function planDoneLine(locale: SeoChecklistLocale, when: string): string {
  return locale === "ar" ? `مُنجزة في الخطة · ${when}` : `Marked done in the plan · ${when}`;
}

export function ownerName(owner: "bot" | "moe", locale: SeoChecklistLocale): string {
  return seoText(owner === "moe" ? "ownerMoe" : "ownerBot", locale);
}

export function statusName(
  status: "blocked-on-approval" | "done" | "in-progress" | "not-started",
  locale: SeoChecklistLocale,
): string {
  if (status === "blocked-on-approval") return seoText("blocked", locale);
  if (status === "in-progress") return seoText("inProgress", locale);
  if (status === "not-started") return seoText("notStarted", locale);
  return seoText("checkedDone", locale);
}
