import { useRef, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Smartphone,
  Download,
  Upload,
  ChevronDown,
  LogOut,
  Heart,
  Sparkles,
  ChevronRight,
  Check,
} from "../components/icons";
import SegmentedButton from "../components/SegmentedButton";
import TextField from "../components/TextField";
import { Link } from "react-router-dom";
import { todayISO } from "../lib/dateUtils";
import { START_PAGES, getStartPage, setStartPage } from "../lib/startPage";
import {
  FORMATS,
  buildExportBlob,
  buildExportAllBlob,
  IMPORT_EXTS,
  downloadBlob,
  entriesToRows,
  activitiesToRows,
  moodsToRows,
  parseImportFile,
  normalizeEntries,
  normalizeActivities,
  normalizeMoods,
} from "../lib/dataTransfer";
import { DEFAULT_ACTIVITIES } from "../lib/moodConfig";
import { useToast } from "../context/ToastContext";
import { useSessionState } from "../hooks/useSessionState";
import { useActivities } from "../hooks/useActivities";
import { useMoods } from "../hooks/useMoods";
import { useAuth } from "../context/AuthContext";
import { useMoodEntries } from "../hooks/useMoodEntries";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { useI18n, LANGUAGES } from "../i18n";
import {
  getStoredTheme,
  getStoredFontScale,
  setTheme,
  setFontScale,
} from "../lib/theme";

const FONT_SIZES = [
  { key: "0.9", size: "13px" },
  { key: "1", size: "15px" },
  { key: "1.15", size: "18px" },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { entries, importEntries } = useMoodEntries();
  const { activities, importActivities } = useActivities();
  const { moods, importMoods } = useMoods();
  const { showToast } = useToast();
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const { t, langPref, setLang } = useI18n();
  const [theme, setThemeState] = useState(getStoredTheme());
  const [fontScale, setFontScaleState] = useState(getStoredFontScale());
  const [startPage, setStartPageState] = useState(getStartPage());
  const [format, setFormat] = useSessionState("settings.format", "csv");
  const [dataOpen, setDataOpen] = useSessionState("settings.dataOpen", false);
  const [busy, setBusy] = useState(null);
  const fileRef = useRef(null);
  const importTarget = useRef(null);

  function handleTheme(value) {
    setThemeState(value);
    setTheme(value);
  }

  function handleFontScale(value) {
    setFontScaleState(value);
    setFontScale(value);
  }

  function handleStartPage(path) {
    setStartPageState(path);
    setStartPage(path);
  }

  const activityById = Object.fromEntries(activities.map((a) => [a.id, a]));

  const rowsFor = {
    entries: () => entriesToRows(entries, activityById),
    activities: () => activitiesToRows(activities),
    moods: () => moodsToRows(moods),
  };

  async function exportDataset(dataset) {
    const rows = rowsFor[dataset]();
    if (rows.length === 0) return showToast(t("settings.exportEmpty"), { type: "info" });
    setBusy(`export:${dataset}`);
    try {
      const blob = await buildExportBlob(format, dataset, rows);
      const name = `moody-${dataset}-${todayISO()}.${format}`;
      downloadBlob(blob, name);
      showToast(t("settings.exported", { name }), { type: "success" });
    } catch {
      showToast(t("settings.exportFailed"), { type: "error" });
    } finally {
      setBusy(null);
    }
  }

  // Xuất toàn bộ dữ liệu trong một lần (json: 1 file, xlsx: 1 file 3 sheet, csv: 1 file .zip chứa 3 csv).
  async function exportAll() {
    const all = { entries: rowsFor.entries(), activities: rowsFor.activities(), moods: rowsFor.moods() };
    setBusy("export:all");
    try {
      const { blob, ext } = await buildExportAllBlob(format, all);
      const name = `moody-all-${todayISO()}.${ext}`;
      downloadBlob(blob, name);
      showToast(t("settings.exported", { name }), { type: "success" });
    } catch {
      showToast(t("settings.exportFailed"), { type: "error" });
    } finally {
      setBusy(null);
    }
  }

  function pickImport(target) {
    importTarget.current = target;
    fileRef.current?.click();
  }

  // Nhập theo thứ tự hoạt động → tâm trạng → check-in (check-in tham chiếu hoạt động nên nhập sau cùng).
  async function importParsed(parsed) {
    const total = { added: 0, updated: 0, skipped: 0 };
    const merge = (r, skipped) => {
      total.added += r?.added ?? 0;
      total.updated += r?.updated ?? 0;
      total.skipped += skipped;
    };
    let knownActivities = activities;
    if (parsed.activities) {
      const n = normalizeActivities(parsed.activities, DEFAULT_ACTIVITIES.map((a) => a.id));
      if (n.items.length) {
        merge(await importActivities(n.items), n.skipped);
        const extra = n.items
          .filter((i) => i.id && !activities.some((a) => a.id === i.id))
          .map((i) => ({ id: i.id, label: i.label, emoji: i.emoji }));
        knownActivities = [...activities, ...extra];
      } else total.skipped += n.skipped;
    }
    if (parsed.moods) {
      const n = normalizeMoods(parsed.moods, moods.map((m) => m.key));
      if (n.items.length) merge(await importMoods(n.items), n.skipped);
      else total.skipped += n.skipped;
    }
    if (parsed.entries) {
      const n = normalizeEntries(parsed.entries, { moods, activities: knownActivities });
      if (n.items.length) merge(await importEntries(n.items), n.skipped);
      else total.skipped += n.skipped;
    }
    return total;
  }

  async function onFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại cùng một file
    const target = importTarget.current;
    if (!file || !target) return;
    setBusy(`import:${target}`);
    try {
      const parsed = await parseImportFile(file, target === "all" ? null : target);
      let total;
      try {
        total = await importParsed(parsed);
      } catch {
        return showToast(t("settings.importErr.write"), { type: "error" });
      }
      if (total.added + total.updated === 0) return showToast(t("settings.importNothing"), { type: "info" });
      showToast(t("settings.importDone", total), { type: "success" });
    } catch (err) {
      const known = ["format", "size", "invalid", "mismatch"].includes(err?.message) ? err.message : "read";
      showToast(t(`settings.importErr.${known}`), { type: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="page page-enter pb-4">
      <h1 className="t-headline-medium mb-6 pt-2">{t("settings.title")}</h1>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-10 lg:items-start">
        <div>
          {user && (
            <div className="flex items-center gap-4 mb-6 card-filled p-4">
              <img
                src={user.photoURL}
                alt=""
                width="48"
                height="48"
                className="w-12 h-12 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="t-title-medium truncate">{user.displayName}</p>
                <p className="t-body-medium text-on-surface-variant truncate">
                  {user.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="btn btn-text-error state shrink-0"
              >
                <LogOut size={18} /> {t("common.logout")}
              </button>
            </div>
          )}

          {canInstall && !installed && (
            <div className="mb-8 bg-primary-container text-on-primary-container rounded-xl p-5 flex items-center gap-4">
              <span className="w-12 h-12 rounded-full bg-surface/60 flex items-center justify-center shrink-0">
                <Smartphone size={24} />
              </span>
              <div className="flex-1">
                <p className="t-title-medium">{t("settings.install")}</p>
                <p className="t-body-medium opacity-80">
                  {t("settings.installText")}
                </p>
              </div>
              <button
                onClick={promptInstall}
                className="btn btn-filled state shrink-0"
              >
                {t("settings.installBtn")}
              </button>
            </div>
          )}

          <SettingGroup title={t("settings.appearance")}>
            <SegmentedButton
              value={theme}
              onChange={handleTheme}
              options={[
                { key: "light", label: t("theme.lightShort"), icon: Sun },
                { key: "dark", label: t("theme.darkShort"), icon: Moon },
                { key: "system", label: t("theme.systemShort"), icon: Monitor },
              ]}
            />
          </SettingGroup>

          <SettingGroup title={t("settings.language")}>
            <SegmentedButton
              value={langPref}
              onChange={setLang}
              options={[{ key: "auto", label: t("settings.langAuto") }, ...LANGUAGES]}
            />
            {langPref === "auto" && (
              <p className="t-body-small text-on-surface-variant px-1 mt-2">
                {t("settings.langAutoHint")}
              </p>
            )}
          </SettingGroup>

        </div>

        <div>
          <SettingGroup title={t("settings.fontSize")}>
            <div className="segmented" role="group">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={fontScale === f.key}
                  onClick={() => handleFontScale(f.key)}
                  className="state"
                >
                  <span className="font-semibold" style={{ fontSize: f.size }}>
                    A
                  </span>
                  <span className="t-label-medium">
                    {t(`settings.font.${f.key}`)}
                  </span>
                </button>
              ))}
            </div>
          </SettingGroup>

          <SettingGroup title={t("settings.startPage")}>
            <p className="t-body-medium text-on-surface-variant mb-3 px-1">
              {t("settings.startPageText")}
            </p>
            <TextField
              as="select"
              label={t("settings.startPage")}
              value={startPage}
              onChange={(e) => handleStartPage(e.target.value)}
            >
              {START_PAGES.map((p) => (
                <option key={p.path} value={p.path}>
                  {t(p.key)}
                </option>
              ))}
            </TextField>
          </SettingGroup>

          <SettingGroup title={t("settings.data")}>
            <div className="card-filled overflow-hidden">
              <button
                onClick={() => setDataOpen((v) => !v)}
                className="state w-full flex items-center gap-4 px-4 h-16 text-left"
                aria-expanded={dataOpen}
              >
                <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <Download size={22} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block t-title-small">{t("settings.exportImport")}</span>
                  <span className="block t-body-small text-on-surface-variant truncate">{t("settings.exportImportSub")}</span>
                </span>
                <ChevronDown
                  size={24}
                  className={`text-on-surface-variant shrink-0 transition-transform duration-200 ${dataOpen ? "rotate-180" : ""}`}
                />
              </button>

              {dataOpen && (
                <div className="px-4 pb-4 pt-1 pop-in">
                  <p className="t-body-medium text-on-surface-variant mb-4">{t("settings.dataHint")}</p>
                  <p className="t-label-medium text-on-surface-variant mb-2">{t("settings.dataFormat")}</p>
                  <SegmentedButton
                    className="mb-5"
                    value={format}
                    onChange={setFormat}
                    options={FORMATS.map((f) => ({ key: f, label: `.${f}` }))}
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept={IMPORT_EXTS.map((x) => `.${x}`).join(",")}
                    onChange={onFileChosen}
                    className="hidden"
                  />

                  <div className="rounded-md bg-surface-container-low border border-outline-variant p-4 mb-3">
                    <p className="t-title-small mb-1">{t("settings.all")}</p>
                    <p className="t-body-small text-on-surface-variant mb-3">
                      {t(`settings.allHint.${format}`)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={exportAll}
                        disabled={!!busy}
                        className="btn btn-filled state flex-1 justify-center"
                      >
                        <Download size={18} />
                        {t("settings.exportAll")}
                      </button>
                      <button
                        onClick={() => pickImport("all")}
                        disabled={!!busy}
                        className="btn btn-tonal state flex-1 justify-center"
                      >
                        <Upload size={18} />
                        {t("settings.importAll")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {["entries", "activities", "moods"].map((ds) => (
                      <div key={ds} className="rounded-md bg-surface-container-low border border-outline-variant p-4">
                        <p className="t-title-small mb-3">{t(`settings.dataset.${ds}`)}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => exportDataset(ds)}
                            disabled={!!busy}
                            className="btn btn-outlined state flex-1 justify-center"
                          >
                            <Download size={18} />
                            {t("settings.exportBtn")}
                          </button>
                          <button
                            onClick={() => pickImport(ds)}
                            disabled={!!busy}
                            className="btn btn-tonal state flex-1 justify-center"
                          >
                            <Upload size={18} />
                            {t("settings.importBtn")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SettingGroup>

          <SettingGroup title={t("settings.about")}>
            <Link to="/welcome" className="card-filled state flex items-center gap-4 p-4">
              <span className="w-10 h-10 rounded-md bg-primary-container text-brand flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block t-title-small">{t("settings.intro")}</span>
                <span className="block t-body-small text-on-surface-variant">{t("settings.introText")}</span>
              </span>
              <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
            </Link>
          </SettingGroup>

          <div className="card-outlined p-4 flex items-center gap-4">
            <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
              <Heart size={20} />
            </span>
            <div className="t-body-medium text-on-surface-variant">
              <p className="t-title-small text-on-surface mb-0.5">Moody</p>
              <p>{t("settings.credit", { author: "minhtrong67" })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="t-title-small text-brand mb-3 px-1">{title}</h2>
      {children}
    </section>
  );
}
