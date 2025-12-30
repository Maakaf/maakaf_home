````md
---
title: "penuX — פייפליין MIMIC-III/MIMIC-IV (קובץ אחד)"
linkTitle: "penuX"
weight: 100
description: "תיעוד בעברית לפייפליין PyTorch בקובץ אחד: אימון, הערכה (AUC/ROC/PR), קליברציה, Bias, והפעלה על MIMIC-III/MIMIC-IV (demo)."
---

## penuX — תיעוד בעברית (ענף `mimic3+4`)

ברוכים הבאים ל־**penuX** — פייפליין מחקרי **בקובץ Python אחד** (`mimic_resistance_pipeline_onefile_torch.py`) שמבצע סיווג רב־מחלקתי של פתוגנים/תוצאות מיקרוביולוגיה על בסיס נתוני **MIMIC-III / MIMIC-IV (Demo)**, ללא pandas וב־PyTorch בלבד.

> ⚠️ **חשוב:** מחקר/דמו בלבד. לא לשימוש קליני.

---

## מה יש בפייפליין

### ✅ מאפיינים עיקריים
- **קובץ אחד**: הכל בסקריפט יחיד
- **ללא pandas**: קריאת CSV סטרימינג (גם `.csv.gz`)
- **זיהוי אוטומטי של דאטהסט**: מבנה MIMIC-III / MIMIC-IV demo
- **מודל היברידי**: Embedding + Conv1D + RNN + BiLSTM + ענף נומרי (Vitals+ABX)
- **Early stopping** לפי יעד Accuracy או F1 (כולל “mrsa_mssa” כאופציית עצירה)
- **Retrain** על TRAIN+VAL לפי epoch “הטוב ביותר”
- **הערכה מורחבת**:
  - Confusion matrix + TP/FP/FN/TN + Sens/Spec/PPV/F1 (OvR)
  - ROC-AUC / PR-AUC (OvR per-class + macro/weighted)
  - Calibration (ECE + Brier + reliability table + PNG)
  - Bias checks לפי תתי־קבוצות (gender / age bins / admission_type / admission_location) best-effort
  - “Vitals signal” (Permutation importance + Pearson r מול P(bacterial)) + PNG

---

## מבנה נתונים נתמך (דמו)

הסקריפט מנסה לגלות אוטומטית “Dataset roots” מתוך:
- נתיב דמו של MIMIC-IV (כמו שמופיע בסקריפט)
- `dataset/mimic` ותתי־תיקיות
- או באמצעות משתנה סביבה:
  - `MIMIC_AUTOROOTS="/path1,/path2"`

### קבצים שצריכים להימצא (ב־MIMIC-III/IV demo layouts)
בפועל, הסקריפט מחפש את:
- `microbiologyevents.csv(.gz)`
- `prescriptions.csv(.gz)`
- `admissions.csv(.gz)`
- `patients.csv(.gz)`
- `d_items.csv(.gz)`
- `chartevents.csv(.gz)`
- `d_labitems.csv(.gz)`
- `labevents.csv(.gz)`

---

## איך מריצים

### 1) דרישות
- Python 3.9+ מומלץ
- PyTorch מותקן (`torch`)
- scikit-learn
- numpy
- matplotlib (אופציונלי – אם רוצים PNG של גרפים)

דוגמה התקנה:
```bash
pip install numpy scikit-learn matplotlib
pip install torch --index-url https://download.pytorch.org/whl/cpu
````

### 2) הרצה בסיסית

```bash
python mimic_resistance_pipeline_onefile_torch.py
```

הסקריפט ינסה:

1. לאתר Dataset roots אוטומטית
2. לבצע split (train/val/test)
3. לאמן מודל עד הגעה ליעד או early stop
4. להדפיס מדדים + לייצר תמונות PNG (אם matplotlib זמין)

---

## משתני סביבה שימושיים (קונפיגורציה)

### יעדי עצירה (Early Stop)

* `TARGET_STOP_METRIC` = `acc` או `f1`
* `TARGET_ACC` (ברירת מחדל 0.95)
* `TARGET_ACC_KIND` = `overall` או `mrsa_mssa`
* `TARGET_F1` (ברירת מחדל 0.925)
* `TARGET_F1_KIND` = `macro` / `weighted` / `mrsa_mssa`

דוגמה:

```bash
export TARGET_STOP_METRIC=f1
export TARGET_F1=0.92
export TARGET_F1_KIND=macro
```

### אימון

* `MAX_EPOCHS` (ברירת מחדל 100000)
* `EARLY_PATIENCE` (ברירת מחדל 360)
* `BATCH_SIZE` (ברירת מחדל 64)
* `LR` (ברירת מחדל 1e-3)
* `WEIGHT_DECAY` (ברירת מחדל 0.0)
* `DROPOUT` (ברירת מחדל 0.25)
* `DEVICE` = `cpu` / `cuda` / ריק (אוטומטי)

### מודל טקסט/רצפים

* `MAX_TEXT_TOKENS` (ברירת מחדל 20000)
* `TEXT_SEQ_LEN` (ברירת מחדל 64)
* `EMBED_DIM` (ברירת מחדל 96)
* `CNN_FILTERS` (ברירת מחדל 128)
* `CNN_KERNEL` (ברירת מחדל 5)
* `RNN_UNITS` (ברירת מחדל 64)
* `LSTM_UNITS` (ברירת מחדל 64)

### חלון זמן לפיצ'רים

* `HOURS_WINDOW` (ברירת מחדל 24)

---

## מה המודל לומד בפועל

### תוויות (Classes)

המודל ממפה אורגניזמים ל־12 מחלקות קבועות (כולל `B:OTHER` ו־`V:OTHER`) לפי `map_org()`.

### קלט טקסט

נבנה כך:

* `spec_type_desc + " [sep] " + interpretation`

### פיצ'רים נומריים (Numeric)

בסדר קבוע:

1. `temperature_c`
2. `wbc`
3. `spo2`
4. `age`
   ואחריהם אינדיקטורים לאנטיביוטיקות:

* `vancomycin, ciprofloxacin, meropenem, piperacillin, ceftriaxone`

---

## קבצי פלט (גרפים)

אם `matplotlib` זמין, הסקריפט ייצור PNG בתיקיית ההרצה, למשל:

* `calibration__<dataset_tag>__<activation>.png`
* `vitals_feature_signal__<dataset_tag>__<activation>.png`

---

## הוספת גרף AUC (ROC/PR) — מה בדיוק “חסר” כרגע?

כיום הסקריפט **מדפיס**:

* ROC-AUC / PR-AUC (OvR, per-class + macro/weighted)

אבל הוא **לא מצייר** גרף ROC/PR.

כדי להוסיף “AUC GRAPH” בצורה נקייה, מומלץ להוסיף:

1. **ROC curves** לכל class (OvR) + מקרו/מיקרו (אופציונלי)
2. **PR curves** לכל class (OvR)
3. לשמור אותם כ־PNG (בדומה לקליברציה)

### איפה להוסיף בקוד?

מיקום הגיוני:
אחרי:

* `probs_te = predict_proba(...)`
* `report_auc_pr(...)`

ואז לקרוא לפונקציה חדשה:

* `plot_auc_curves(y_true=y_te, probs=probs_te, title=f"TEST {ds_tag}", out_png_prefix=f"auc__{ds_tag}__{_sanitize_tag(best_activation)}")`

---

## סדר עבודה מומלץ (ORDER BY “הסשן” שלך)

1. **לתעד** (README/Docs) מה הסקריפט עושה ומה יוצא ממנו (זה הקובץ הזה)
2. **להוסיף “refs”**: סעיף “מקורות/References” (למשל MIMIC, scikit-learn metrics, calibration)
3. **להוסיף AUC graph**: ROC/PR plots כ־PNG (כמו calibration)
4. **לשמור על One-File**: כל הפונקציות נשארות בתוך אותו `.py`

---

## מקורות (References)

> כאן מומלץ לשים הפניות כלליות (לא ציטוטים ארוכים), לדוגמה:

* MIMIC-III / MIMIC-IV Demo datasets (PhysioNet)
* scikit-learn: ROC AUC / Average Precision / Confusion Matrix
* Calibration metrics: Expected Calibration Error (ECE), Brier Score
* Class-balanced loss / focal loss (רקע תיאורטי)

---

## קומיט/PR — המלצה

* ליצור branch חדש
* לבצע commit קצר וברור (<80 תווים)
* לפתוח Pull Request לעיון

דוגמה:

```bash
git checkout -b docs-hebrew
git add <path>/thisfile.md
git commit -m "הוספת תיעוד בעברית לפייפליין penuX"
git push origin docs-hebrew
```

```
::contentReference[oaicite:0]{index=0}
```
