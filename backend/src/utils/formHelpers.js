/**
 * Utility helpers for sanitizing Google Form questions and items.
 * Converts unsupported FILE_UPLOAD questions into short text questions
 * requesting Google Drive / Photos shareable links.
 */

export function sanitizeFileUploadQuestion(question) {
  if (!question) return question;

  const typeStr = String(question.type || question.questionType || '').toLowerCase();
  const titleStr = String(question.title || question.question || '').toLowerCase();

  const isFileUpload =
    ['file_upload', 'file', 'upload', 'attachment', 'image_upload'].includes(typeStr) ||
    question.type === 'FILE_UPLOAD' ||
    question.questionType === 'FILE_UPLOAD' ||
    (typeStr === 'short_text' && (titleStr.includes('upload') || titleStr.includes('attach')) && (titleStr.includes('file') || titleStr.includes('image') || titleStr.includes('photo') || titleStr.includes('document') || titleStr.includes('resume') || titleStr.includes('id')));

  if (isFileUpload && question.kind !== 'image') {
    const rawTitle = question.title || question.question || 'File Upload';
    const hasSuffix = rawTitle.includes('Google Drive') || rawTitle.includes('Photos shareable link') || rawTitle.includes('Paste your image link');

    return {
      ...question,
      kind: 'question',
      type: 'short_text',
      questionType: 'short_text',
      title: hasSuffix
        ? rawTitle
        : rawTitle + ' — Please paste your Google Drive / Photos shareable link here',
      description: question.description || 'Upload your image to Google Drive and paste the shareable link below.',
      choices: []
    };
  }

  return question;
}

export function sanitizeAllFileUploads(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (item && item.questions && Array.isArray(item.questions)) {
      return {
        ...item,
        questions: item.questions.map(sanitizeFileUploadQuestion)
      };
    }
    return sanitizeFileUploadQuestion(item);
  });
}
