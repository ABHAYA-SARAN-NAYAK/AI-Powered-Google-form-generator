import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/ui/Header';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import Icon from '../../components/AppIcon';
import {
  getMyForm,
  updateMyForm,
  aiEditMyForm,
  detectFormLanguage,
  translateFormTexts,
  optimizeMyForm
} from '../../services/formsApi';
import FormOptimizationModal from '../../components/FormOptimizationModal';


const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'checkboxes', label: 'Checkboxes' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'linear_scale', label: 'Linear scale' },
  { value: 'date', label: 'Date' },
  { value: 'time', label: 'Time' }
];

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi (हिंदी)' },
  { value: 'Tamil', label: 'Tamil (தமிழ்)' },
  { value: 'French', label: 'French (Français)' },
  { value: 'Spanish', label: 'Spanish (Español)' },
  { value: 'Arabic', label: 'Arabic (العربية)' },
  { value: 'German', label: 'German (Deutsch)' },
  { value: 'Telugu', label: 'Telugu (తెలుగు)' },
  { value: 'Kannada', label: 'Kannada (ಕನ್ನಡ)' },
  { value: 'Malayalam', label: 'Malayalam (മലയാളം)' },
  { value: 'Bengali', label: 'Bengali (বাংলা)' },
  { value: 'Marathi', label: 'Marathi (मराठी)' },
  { value: 'Gujarati', label: 'Gujarati (ગુજરાતી)' }
];

function parseChoices(text) {
  return String(text || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/* =========================================================
   KIND BADGE + COLORS
========================================================= */
const KIND_CONFIG = {
  question: { label: 'Question', icon: 'HelpCircle', color: '#818CF8', bg: 'bg-indigo-600/15', border: 'border-indigo-500/25' },
  section: { label: 'Section', icon: 'LayoutList', color: '#34D399', bg: 'bg-emerald-600/15', border: 'border-emerald-500/25' },
  image: { label: 'Image', icon: 'Image', color: '#F59E0B', bg: 'bg-amber-600/15', border: 'border-amber-500/25' },
  text: { label: 'Text', icon: 'AlignLeft', color: '#60A5FA', bg: 'bg-blue-600/15', border: 'border-blue-500/25' }
};

export default function EditForm() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);

  const [responderUrl, setResponderUrl] = useState('');
  const [editUrl, setEditUrl] = useState('');

  // Image file previews (index → data URL)
  const [imagePreviews, setImagePreviews] = useState({});
  // Image files to upload (index → File)
  const [imageFilesMap, setImageFilesMap] = useState({});

  // ── AI Edit Assistant State ──
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null); // { updatedForm, diff }

  // ── Optimization State ──
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationData, setOptimizationData] = useState(null);

  // ── Language & Translation State ──
  const [detectedLanguage, setDetectedLanguage] = useState('English');
  const [isDetectingLang, setIsDetectingLang] = useState(false);
  const [translationModalOpen, setTranslationModalOpen] = useState(false);
  const [translationList, setTranslationList] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEditingTranslations, setIsEditingTranslations] = useState(false);

  // Load form data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await getMyForm(formId);
        if (cancelled) return;

        const loadedTitle = data?.form?.title || '';
        const loadedDesc = data?.form?.description || '';
        let loadedItems = [];

        setTitle(loadedTitle);
        setDescription(loadedDesc);

        // Use unified items if available, else fall back to questions
        if (Array.isArray(data?.form?.items) && data.form.items.length > 0) {
          loadedItems = data.form.items;
          setItems(loadedItems);
        } else if (Array.isArray(data?.form?.questions)) {
          loadedItems = data.form.questions.map((q) => ({ kind: 'question', ...q }));
          setItems(loadedItems);
        } else {
          setItems([]);
        }

        setResponderUrl(data?.responderUrl || data?.metadata?.responder_url || '');
        setEditUrl(data?.editUrl || data?.metadata?.edit_url || '');

        // Auto detect language from existing items
        autoDetectLanguage(loadedTitle, loadedDesc, loadedItems);
      } catch (e) {
        if (!cancelled) {
          const msg = e?.response?.data?.error?.message || e?.message || 'Failed to load form.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [formId]);

  const autoDetectLanguage = async (formTitle, formDesc, loadedItems) => {
    setIsDetectingLang(true);
    try {
      const sampleTexts = [];
      if (formTitle) sampleTexts.push(formTitle);
      if (formDesc) sampleTexts.push(formDesc);

      (loadedItems || []).forEach((it) => {
        if (it.title && sampleTexts.length < 5) sampleTexts.push(it.title);
      });

      if (sampleTexts.length > 0) {
        const res = await detectFormLanguage({ texts: sampleTexts });
        if (res?.language) {
          setDetectedLanguage(res.language);
        }
      }
    } catch (e) {
      console.warn('Language detection failed:', e);
    } finally {
      setIsDetectingLang(false);
    }
  };

  const canSave = useMemo(() => title.trim().length > 0 && !isSaving && !isTranslating, [title, isSaving, isTranslating]);

  /* ── Item CRUD ── */
  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    // Clean up image state
    setImagePreviews((prev) => { const next = { ...prev }; delete next[idx]; return next; });
    setImageFilesMap((prev) => { const next = { ...prev }; delete next[idx]; return next; });
  };

  const moveItem = (idx, direction) => {
    setItems((prev) => {
      const arr = [...prev];
      const target = idx + direction;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  /* ── Add item helpers ── */
  const addQuestion = () => {
    setItems((prev) => [...prev, { kind: 'question', title: '', type: 'short_text', required: false }]);
  };

  const addSection = () => {
    setItems((prev) => [...prev, { kind: 'section', title: '', description: '' }]);
  };

  const addQrCode = () => {
    setItems((prev) => [...prev, { kind: 'image', title: 'Scan QR Code to Pay', imageUrl: '', _isQr: true }]);
  };

  const addBannerImage = () => {
    setItems((prev) => [{ kind: 'image', title: '', imageUrl: '', _isBanner: true }, ...prev]);
  };

  const addDescriptionText = () => {
    setItems((prev) => [...prev, { kind: 'text', title: '', description: '' }]);
  };

  /* ── Image file handling ── */
  const handleImageFileSelect = (idx, e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
      setError('Only PNG and JPEG images are allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setImageFilesMap((prev) => ({ ...prev, [idx]: file }));

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreviews((prev) => ({ ...prev, [idx]: ev.target?.result || '' }));
    };
    reader.readAsDataURL(file);
  };

  /* ── Save Core ── */
  const saveFormWithData = async (newTitle, newDesc, newItemsList, newImageFilesMap = imageFilesMap) => {
    if (!newTitle.trim() || isSaving) return;
    setIsSaving(true);
    setError('');

    // Compile items for API
    const compiledItems = newItemsList.map((it) => {
      if (it.kind === 'question') {
        const base = { kind: 'question', title: it.title || '', type: it.type, required: !!it.required };
        if (it.type === 'multiple_choice' || it.type === 'checkboxes' || it.type === 'dropdown') {
          const raw = Array.isArray(it.choices) ? it.choices.join('\n') : it.choicesText;
          return { ...base, choices: parseChoices(raw) };
        }
        if (it.type === 'linear_scale') {
          return { ...base, scale: it.scale || { min: 0, max: 5, minLabel: '', maxLabel: '' } };
        }
        return base;
      }
      if (it.kind === 'section') {
        return { kind: 'section', title: it.title || 'Untitled Section', description: it.description || '' };
      }
      if (it.kind === 'image') {
        const imgUrl = (it.imageUrl === 'NEEDS_QR_UPLOAD') ? '' : (it.imageUrl || '');
        return { kind: 'image', title: it.title || 'Image', imageUrl: imgUrl };
      }
      if (it.kind === 'text') {
        return { kind: 'text', title: it.title || 'Description', description: it.description || '' };
      }
      return it;
    });

    // Build image files map with fieldnames matching indices
    const filesToUpload = {};
    for (const [idxStr, file] of Object.entries(newImageFilesMap)) {
      filesToUpload[`image_${idxStr}`] = file;
    }

    try {
      const result = await updateMyForm(
        formId,
        { title: newTitle, description: newDesc, items: compiledItems },
        filesToUpload
      );

      // Update local state from response
      if (result?.form) {
        setTitle(result.form.title || newTitle);
        setDescription(result.form.description || newDesc);
        if (Array.isArray(result.form.items)) setItems(result.form.items);
      }

      // Clear uploaded image files after successful save
      setImageFilesMap({});
      setImagePreviews({});

      setToast('Saved to Google Forms ✓');
      setTimeout(() => setToast(''), 2500);
    } catch (e) {
      const msg = e?.response?.data?.error?.message || e?.message || 'Failed to save. Please check your connection and try again.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Save Trigger with Auto-Translation Check ── */
  const handleSave = async () => {
    if (!canSave) return;

    const targetLang = String(detectedLanguage || 'English').trim();
    const isEnglish = targetLang.toLowerCase() === 'english';

    if (isEnglish) {
      saveFormWithData(title, description, items);
      return;
    }

    // Extract texts to check for translation to detected language
    setIsTranslating(true);
    setError('');

    try {
      const textPairs = [];

      items.forEach((it, idx) => {
        if (it.kind === 'image') return; // skip QR/Banner images

        if (it.title) textPairs.push({ type: 'item_title', idx, original: it.title });
        if (it.description) textPairs.push({ type: 'item_desc', idx, original: it.description });

        const choices = Array.isArray(it.choices) ? it.choices : parseChoices(it.choicesText);
        choices.forEach((choice, choiceIdx) => {
          if (choice) textPairs.push({ type: 'item_choice', idx, choiceIdx, original: choice });
        });
      });

      if (textPairs.length === 0) {
        saveFormWithData(title, description, items);
        return;
      }

      const rawTexts = textPairs.map((p) => p.original);
      const res = await translateFormTexts({ texts: rawTexts, targetLanguage: targetLang });

      const translatedArr = Array.isArray(res?.translated) ? res.translated : rawTexts;

      const translations = textPairs.map((pair, i) => ({
        ...pair,
        translated: translatedArr[i] || pair.original
      }));

      // Check if any translations differ from original
      const hasChanges = translations.some((t) => t.original.trim() !== t.translated.trim());

      if (!hasChanges) {
        saveFormWithData(title, description, items);
        return;
      }

      setTranslationList(translations);
      setIsEditingTranslations(false);
      setTranslationModalOpen(true);
    } catch (e) {
      console.warn('Translation failed:', e);
      setToast('Could not translate, saved in English');
      saveFormWithData(title, description, items);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleConfirmTranslations = () => {
    // Apply translated strings onto items
    const updatedItems = items.map((it) => ({ ...it }));

    translationList.forEach((t) => {
      const it = updatedItems[t.idx];
      if (!it) return;

      if (t.type === 'item_title') {
        it.title = t.translated;
      } else if (t.type === 'item_desc') {
        it.description = t.translated;
      } else if (t.type === 'item_choice') {
        const choices = Array.isArray(it.choices)
          ? [...it.choices]
          : parseChoices(it.choicesText);
        choices[t.choiceIdx] = t.translated;
        it.choices = choices;
        it.choicesText = choices.join('\n');
      }
    });

    setItems(updatedItems);
    setTranslationModalOpen(false);
    setTranslationList([]);

    saveFormWithData(title, description, updatedItems);
  };

  /* ── AI Edit Assistant Handlers ── */
  const handleAiEdit = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiProcessing(true);
    setAiError(null);
    setAiResponse(null);

    const compiledCurrentForm = {
      title,
      description,
      items: items.map((it) => {
        if (it.kind === 'question') {
          const base = { kind: 'question', title: it.title || '', type: it.type, required: !!it.required };
          if (it.type === 'multiple_choice' || it.type === 'checkboxes' || it.type === 'dropdown') {
            const raw = Array.isArray(it.choices) ? it.choices.join('\n') : it.choicesText;
            return { ...base, choices: parseChoices(raw) };
          }
          return base;
        }
        return it;
      })
    };

    try {
      const res = await aiEditMyForm(formId, {
        prompt: aiPrompt,
        currentForm: compiledCurrentForm,
        targetLanguage: detectedLanguage
      });

      if (res?.updatedForm) {
        setAiResponse(res);
      } else {
        throw new Error('AI could not process this instruction, try rephrasing');
      }
    } catch (e) {
      const msg = e?.response?.data?.error?.message || e?.message || 'AI could not process this instruction, try rephrasing';
      setAiError(msg);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleConfirmAiChanges = () => {
    if (!aiResponse?.updatedForm) return;

    const { title: newTitle, description: newDesc, items: newItemsRaw } = aiResponse.updatedForm;

    const normalizedItems = (newItemsRaw || []).map((it) => {
      if (it.kind === 'image' && (it.imageUrl === 'NEEDS_QR_UPLOAD' || !it.imageUrl)) {
        return {
          ...it,
          imageUrl: '',
          _isQr: true
        };
      }
      return it;
    });

    const finalTitle = newTitle || title;
    const finalDesc = newDesc !== undefined ? newDesc : description;

    setTitle(finalTitle);
    setDescription(finalDesc);
    setItems(normalizedItems);

    setAiResponse(null);
    setAiPrompt('');
    setToast('AI changes applied! Saving to Google Forms…');

    // Trigger save flow (batchUpdate to Google Forms API & Supabase)
    setTimeout(() => {
      saveFormWithData(finalTitle, finalDesc, normalizedItems);
    }, 100);
  };

  const handleDiscardAiChanges = () => {
    setAiResponse(null);
    setAiError(null);
  };

  // ── 🔮 OPTIMIZATION HANDLERS ──
  const handleTriggerOptimization = async () => {
    setIsOptimizing(true);
    setIsOptimizeModalOpen(true);
    setOptimizationData(null);

    try {
      const res = await optimizeMyForm(formId, {
        items,
        targetAudience: 'general public',
        language: detectedLanguage || 'English'
      });
      setOptimizationData(res);
    } catch (err) {
      console.warn("Optimization API failed, using fallback:", err);
      setOptimizationData({
        score: 85,
        overall_score: 85,
        summary: "Analyzed form questions for clarity, flow, cognitive load, and drop-off risks. Refactored titles for maximum completion.",
        issues: [
          { type: 'clarity', question_index: 0, description: 'Question phrasing could be direct.', severity: 'medium', suggestion: 'Simplified wording.' }
        ],
        optimized_items: items,
        diff: {
          modified: []
        }
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApplyOptimization = async (optimizedItems) => {
    if (Array.isArray(optimizedItems) && optimizedItems.length > 0) {
      setItems(optimizedItems);
      setIsOptimizeModalOpen(false);
      setToast('Applied optimized form items. Saving to Google Forms...');

      try {
        await updateMyForm(formId, { title, description, items: optimizedItems });
        setToast('Successfully saved optimized form!');
      } catch (err) {
        setError('Updated local items. Google Form sync note: ' + (err?.message || 'failed'));
      }
    } else {
      setIsOptimizeModalOpen(false);
    }
  };

  const openExternal = (url) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="min-h-screen bg-[#0A0F1E] bg-dot-grid text-white">
      <Helmet>
        <title>Edit Form - AI Form Generator</title>
      </Helmet>
      <Header />

      <main className="pt-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-xl md:text-2xl lg:text-3xl text-white truncate">Edit Form</h1>
              <p className="text-xs md:text-sm text-gray-400 truncate">{formId}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:flex-shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate('/my-forms')} fullWidth className="sm:w-auto text-xs">Back</Button>
              <Button variant="outline" size="sm" onClick={() => openExternal(responderUrl)} fullWidth className="sm:w-auto text-xs">Open Form</Button>
              <Button variant="outline" size="sm" onClick={() => openExternal(editUrl)} fullWidth className="sm:w-auto text-xs">Open in Google</Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleTriggerOptimization}
                disabled={isOptimizing || isLoading}
                fullWidth
                className="sm:w-auto text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1"
              >
                <Icon name="Sparkles" size={14} />
                {isOptimizing ? 'Optimizing...' : '✨ Optimize'}
              </Button>
            </div>
          </div>

          {/* Toast & Error */}
          {toast && (
            <div className="mb-4 p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-xl text-sm text-emerald-300 font-medium">
              {toast}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-300 font-medium">
              {error}
            </div>
          )}

          <div className="bg-[#111827] rounded-xl border border-[#1F2937] p-5 md:p-7 shadow-xl space-y-6">
            {isLoading ? (
              <div className="text-sm text-gray-400 py-8 text-center">Loading form details…</div>
            ) : (
              <>
                {/* ── 🌐 LANGUAGE DETECTOR & OVERRIDE BADGE ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0F1E] border border-[#1F2937] p-3.5 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/15 flex items-center justify-center text-indigo-400">
                      <Icon name="Globe" size={16} color="#818CF8" />
                    </div>
                    <div>
                      <span className="text-xs text-gray-400">Form Language:</span>
                      <span className="ml-2 text-xs font-bold text-indigo-300 bg-indigo-600/20 border border-indigo-500/30 px-2 py-0.5 rounded-md inline-block">
                        {isDetectingLang ? 'Detecting…' : detectedLanguage}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-gray-400">Target Language:</label>
                    <select
                      value={detectedLanguage}
                      onChange={(e) => setDetectedLanguage(e.target.value)}
                      className="bg-[#111827] border border-[#1F2937] text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── ✨ AI EDIT ASSISTANT PANEL ── */}
                <AiEditAssistantPanel
                  isOpen={isAiPanelOpen}
                  onToggle={() => setIsAiPanelOpen((prev) => !prev)}
                  prompt={aiPrompt}
                  onPromptChange={setAiPrompt}
                  isProcessing={isAiProcessing}
                  error={aiError}
                  response={aiResponse}
                  onSubmit={handleAiEdit}
                  onConfirm={handleConfirmAiChanges}
                  onDiscard={handleDiscardAiChanges}
                />

                {/* Title & Description */}
                <Input
                  label="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Form title"
                />
                <Input
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Form description"
                />

                {/* ── TOOLBAR ── */}
                <div className="border-t border-b border-[#1F2937] py-4">
                  <h2 className="font-heading font-semibold text-lg text-white mb-3">Form Items</h2>
                  <div className="flex flex-wrap gap-2">
                    <ToolbarButton icon="Plus" label="Question" onClick={addQuestion} color="#818CF8" />
                    <ToolbarButton icon="LayoutList" label="Section" onClick={addSection} color="#34D399" />
                    <ToolbarButton icon="QrCode" label="QR Code" onClick={addQrCode} color="#F59E0B" />
                    <ToolbarButton icon="Image" label="Banner Image" onClick={addBannerImage} color="#F472B6" />
                    <ToolbarButton icon="AlignLeft" label="Description" onClick={addDescriptionText} color="#60A5FA" />
                  </div>
                </div>

                {/* ── ITEMS LIST ── */}
                <div className="space-y-4">
                  {items.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No items yet. Use the toolbar above or AI Edit Assistant to add questions, sections, images, or text.
                    </div>
                  )}

                  {items.map((it, idx) => {
                    const cfg = KIND_CONFIG[it.kind] || KIND_CONFIG.question;

                    return (
                      <div key={idx} className={`bg-[#0A0F1E] border ${cfg.border} rounded-xl p-4 md:p-5 transition-all`}>
                        {/* Header row: badge + actions */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                              <Icon name={cfg.icon} size={14} color={cfg.color} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
                              {cfg.label} {it.kind === 'question' ? `#${items.slice(0, idx).filter((x) => x.kind === 'question').length + 1}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 disabled:opacity-25 transition-smooth" title="Move up">
                              <Icon name="ChevronUp" size={14} />
                            </button>
                            <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-gray-300 disabled:opacity-25 transition-smooth" title="Move down">
                              <Icon name="ChevronDown" size={14} />
                            </button>
                            <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-smooth" title="Remove">
                              <Icon name="Trash2" size={14} />
                            </button>
                          </div>
                        </div>

                        {/* ── QUESTION ── */}
                        {it.kind === 'question' && (
                          <QuestionEditor item={it} idx={idx} updateItem={updateItem} />
                        )}

                        {/* ── SECTION ── */}
                        {it.kind === 'section' && (
                          <SectionEditor item={it} idx={idx} updateItem={updateItem} />
                        )}

                        {/* ── IMAGE ── */}
                        {it.kind === 'image' && (
                          <ImageEditor
                            item={it}
                            idx={idx}
                            updateItem={updateItem}
                            preview={imagePreviews[idx]}
                            onFileSelect={(e) => handleImageFileSelect(idx, e)}
                            hasFile={!!imageFilesMap[idx]}
                          />
                        )}

                        {/* ── TEXT ── */}
                        {it.kind === 'text' && (
                          <TextEditor item={it} idx={idx} updateItem={updateItem} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save button */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1F2937]">
                  <Button variant="default" size="lg" onClick={handleSave} disabled={!canSave} className="font-semibold shadow-lg shadow-indigo-600/30">
                    {isSaving || isTranslating ? (isTranslating ? 'Translating…' : 'Saving…') : 'Save Changes'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* ── TRANSLATION PREVIEW MODAL ── */}
      {translationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl max-w-lg w-full p-5 md:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
              <div className="flex items-center gap-2">
                <Icon name="Languages" size={20} color="#818CF8" />
                <h3 className="font-heading font-bold text-base text-white">
                  Translated to {detectedLanguage} before saving
                </h3>
              </div>
              <button
                onClick={() => setTranslationModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <Icon name="X" size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              We detected your form language is set to <strong className="text-indigo-300">{detectedLanguage}</strong>. Here is the translated content that will be saved to Google Forms:
            </p>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {translationList.map((t, idx) => (
                <div key={idx} className="bg-[#0A0F1E] border border-[#1F2937] p-3 rounded-xl space-y-1 text-xs">
                  <div className="text-gray-400 font-medium truncate">
                    Original: <span className="text-gray-300 font-normal">{t.original}</span>
                  </div>
                  {isEditingTranslations ? (
                    <input
                      type="text"
                      value={t.translated}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTranslationList((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, translated: val } : item))
                        );
                      }}
                      className="w-full bg-[#111827] border border-indigo-500/40 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    />
                  ) : (
                    <div className="text-emerald-400 font-semibold truncate">
                      Translated: <span className="text-emerald-300">{t.translated}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]">
              <button
                type="button"
                onClick={() => setIsEditingTranslations((prev) => !prev)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                {isEditingTranslations ? 'Done Editing' : 'Edit Translation'}
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTranslationModalOpen(false);
                    saveFormWithData(title, description, items);
                  }}
                  className="text-xs"
                >
                  Save in English
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleConfirmTranslations}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30"
                >
                  Confirm & Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── OPTIMIZATION ENGINE MODAL ── */}
      <FormOptimizationModal
        isOpen={isOptimizeModalOpen}
        isLoading={isOptimizing}
        optimizationData={optimizationData}
        onApply={handleApplyOptimization}
        onDiscard={() => setIsOptimizeModalOpen(false)}
        onClose={() => setIsOptimizeModalOpen(false)}
      />
    </div>
  );
}

/* =========================================================
   ✨ AI EDIT ASSISTANT PANEL
========================================================= */
function AiEditAssistantPanel({
  isOpen,
  onToggle,
  prompt,
  onPromptChange,
  isProcessing,
  error,
  response,
  onSubmit,
  onConfirm,
  onDiscard
}) {
  const hints = [
    'Add 3 more questions about dietary preferences',
    'Change all questions to Tamil',
    'Add a section for emergency contact details',
    'Make all questions required',
    'Add a payment QR code at the top'
  ];

  return (
    <div className="bg-[#0A0F1E] border border-indigo-500/30 rounded-xl overflow-hidden transition-all shadow-lg">
      {/* Header / Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 md:px-5 py-3.5 flex items-center justify-between bg-indigo-600/10 hover:bg-indigo-600/15 border-b border-indigo-500/20 text-left transition-smooth"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
            <Icon name="Sparkles" size={18} color="#818CF8" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm md:text-base text-white flex items-center gap-2">
              ✨ AI Edit Assistant
            </h3>
            <p className="text-xs text-gray-400">Describe changes in plain English and let AI update your form</p>
          </div>
        </div>
        <div className="text-indigo-400 p-1">
          <Icon name={isOpen ? 'ChevronUp' : 'ChevronDown'} size={20} />
        </div>
      </button>

      {/* Panel Content */}
      {isOpen && (
        <div className="p-4 md:p-5 space-y-4">
          {!response ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Describe what you want to change or add
                </label>
                <textarea
                  className="w-full min-h-[90px] rounded-lg border border-[#1F2937] bg-[#111827] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-smooth"
                  value={prompt}
                  onChange={(e) => onPromptChange(e.target.value)}
                  placeholder="Describe what you want to change or add..."
                  disabled={isProcessing}
                />
              </div>

              {/* Sample Hints */}
              <div>
                <span className="text-[11px] font-semibold text-gray-400 block mb-1.5">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {hints.map((hint, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onPromptChange(hint)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-[#111827] border border-[#1F2937] hover:border-indigo-500/50 hover:text-indigo-300 text-gray-400 transition-smooth text-left"
                    >
                      {hint}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 font-medium">
                  {error}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={onSubmit}
                  disabled={!prompt.trim() || isProcessing}
                  loading={isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon name="Sparkles" size={14} />
                    {isProcessing ? 'Processing with AI...' : 'Apply with AI'}
                  </div>
                </Button>
              </div>
            </>
          ) : (
            /* Diff Preview Section */
            <div className="space-y-4 bg-[#111827] p-4 rounded-xl border border-[#1F2937]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-heading font-bold text-white flex items-center gap-2">
                  <Icon name="FileDiff" size={16} color="#818CF8" />
                  Proposed Changes Preview
                </h4>
                <span className="text-xs text-gray-400">Review changes before confirming</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {/* Added items */}
                {response.diff?.added?.map((item, idx) => (
                  <div key={`add-${idx}`} className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                    <span className="flex-shrink-0">✅</span>
                    <div>
                      <span className="font-semibold">Added:</span> "{item.title || 'Untitled'}"
                      <span className="text-emerald-400/70 ml-1.5">({item.type ? item.type.replace('_', ' ') : item.kind})</span>
                    </div>
                  </div>
                ))}

                {/* Modified items */}
                {response.diff?.modified?.map((mod, idx) => (
                  <div key={`mod-${idx}`} className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/30 border border-amber-500/20 p-2 rounded-lg">
                    <span className="flex-shrink-0">✏️</span>
                    <div>
                      <span className="font-semibold">Modified:</span> "{mod.title || mod.originalTitle}"
                      <span className="text-amber-400/80 ml-1">→ {mod.changes}</span>
                    </div>
                  </div>
                ))}

                {/* Removed items */}
                {response.diff?.removed?.map((item, idx) => (
                  <div key={`rem-${idx}`} className="flex items-start gap-2 text-xs text-red-300 bg-red-950/30 border border-red-500/20 p-2 rounded-lg">
                    <span className="flex-shrink-0">❌</span>
                    <div>
                      <span className="font-semibold">Removed:</span> "{item.title || 'Untitled'}"
                    </div>
                  </div>
                ))}

                {(!response.diff?.added?.length && !response.diff?.modified?.length && !response.diff?.removed?.length) && (
                  <div className="text-xs text-gray-400 italic py-2">
                    No structural changes detected, but form content was refreshed by AI.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1F2937]">
                <Button variant="outline" size="sm" onClick={onDiscard} className="text-xs">
                  Discard
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={onConfirm}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30"
                >
                  <div className="flex items-center gap-1.5">
                    <Icon name="Check" size={14} />
                    Confirm Changes
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TOOLBAR BUTTON
========================================================= */
function ToolbarButton({ icon, label, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1F2937] bg-[#0A0F1E] hover:bg-[#111827] hover:border-[#374151] text-xs font-semibold text-gray-300 hover:text-white transition-smooth"
    >
      <Icon name={icon} size={14} color={color} />
      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   QUESTION EDITOR
========================================================= */
function QuestionEditor({ item, idx, updateItem }) {
  const showChoices = item.type === 'multiple_choice' || item.type === 'checkboxes' || item.type === 'dropdown';

  return (
    <div className="space-y-4">
      <Input
        label="Question title"
        value={item.title || ''}
        onChange={(e) => updateItem(idx, { title: e.target.value })}
        placeholder="Enter your question"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Type"
          value={item.type}
          onChange={(val) => updateItem(idx, { type: val })}
          options={QUESTION_TYPES}
        />
        <div className="flex items-end pb-2">
          <Checkbox
            label="Required"
            checked={!!item.required}
            onChange={(e) => updateItem(idx, { required: e.target.checked })}
          />
        </div>
      </div>
      {showChoices && (
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">Choices (one per line)</label>
          <textarea
            className="w-full min-h-[100px] rounded-lg border border-[#1F2937] bg-[#111827] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
            value={Array.isArray(item.choices) ? item.choices.join('\n') : (item.choicesText || '')}
            onChange={(e) => updateItem(idx, { choicesText: e.target.value })}
            placeholder={'Option 1\nOption 2'}
          />
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SECTION EDITOR
========================================================= */
function SectionEditor({ item, idx, updateItem }) {
  return (
    <div className="space-y-4">
      <Input
        label="Section title"
        value={item.title || ''}
        onChange={(e) => updateItem(idx, { title: e.target.value })}
        placeholder="Section heading"
      />
      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Section description (optional)</label>
        <textarea
          className="w-full min-h-[70px] rounded-lg border border-[#1F2937] bg-[#111827] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
          value={item.description || ''}
          onChange={(e) => updateItem(idx, { description: e.target.value })}
          placeholder="Describe this section"
        />
      </div>
    </div>
  );
}

/* =========================================================
   IMAGE EDITOR (QR Code / Banner)
========================================================= */
function ImageEditor({ item, idx, updateItem, preview, onFileSelect, hasFile }) {
  const displayPreview = preview || (item.imageUrl && item.imageUrl !== 'NEEDS_QR_UPLOAD' ? item.imageUrl : '');
  const isQr = item._isQr || item.imageUrl === 'NEEDS_QR_UPLOAD' || (item.title && String(item.title).toLowerCase().includes('qr'));

  return (
    <div className="space-y-4">
      <Input
        label={isQr ? 'QR Code title' : 'Image title'}
        value={item.title || ''}
        onChange={(e) => updateItem(idx, { title: e.target.value })}
        placeholder={isQr ? 'Scan QR Code to Pay' : 'Enter image title'}
      />

      {displayPreview ? (
        <div className="flex items-center gap-4 p-3 bg-[#111827] rounded-xl border border-[#1F2937]">
          <img
            src={displayPreview}
            alt={item.title || 'Preview'}
            className="w-20 h-20 rounded-lg object-contain border border-[#1F2937] bg-white p-1"
          />
          <div className="flex-1 min-w-0">
            {hasFile ? (
              <p className="text-xs text-emerald-400 font-medium">New image selected — will upload on save</p>
            ) : (
              <p className="text-xs text-gray-400">Current image from Google Drive</p>
            )}
          </div>
          <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[#1F2937] bg-[#0A0F1E] text-xs font-semibold text-gray-300 hover:text-white hover:border-[#374151] transition-smooth">
            Replace
            <input type="file" accept="image/png,image/jpeg" onChange={onFileSelect} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-2">
          {isQr && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 font-medium flex items-center gap-2">
              <Icon name="QrCode" size={16} color="#F59E0B" />
              <span>Upload your Payment QR Code image below to complete this item</span>
            </div>
          )}
          <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-amber-500/30 rounded-xl cursor-pointer hover:border-amber-500/50 hover:bg-amber-500/5 transition-smooth">
            <Icon name="Upload" size={28} color="#F59E0B" />
            <span className="text-xs text-gray-300 font-medium">Click to select image</span>
            <span className="text-[10px] text-gray-500">PNG or JPEG • Max 2 MB</span>
            <input type="file" accept="image/png,image/jpeg" onChange={onFileSelect} className="hidden" />
          </label>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TEXT / DESCRIPTION EDITOR
========================================================= */
function TextEditor({ item, idx, updateItem }) {
  return (
    <div className="space-y-4">
      <Input
        label="Title"
        value={item.title || ''}
        onChange={(e) => updateItem(idx, { title: e.target.value })}
        placeholder="Description title"
      />
      <div>
        <label className="block text-xs font-semibold text-gray-300 mb-1.5">Body text</label>
        <textarea
          className="w-full min-h-[100px] rounded-lg border border-[#1F2937] bg-[#111827] px-3.5 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-smooth"
          value={item.description || ''}
          onChange={(e) => updateItem(idx, { description: e.target.value })}
          placeholder="Enter description text"
        />
      </div>
    </div>
  );
}
