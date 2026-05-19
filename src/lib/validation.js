export const validateRequired = (value) => {
  if (!value || value.trim().length === 0) return 'هذا الحقل مطلوب';
  return null;
};

export const validateMinLength = (value, min) => {
  if (!value || value.trim().length < min) return 'يرجى كتابة عنوان مفصّل';
  return null;
};

// Jordan mobile: 07[7-9] + 7 digits. Accept +962 / 962 / 0 prefixes.
const JO_PHONE = /^(\+?962|0)?7[789]\d{7}$/;

export const validatePhone = (value) => {
  if (!value || !JO_PHONE.test(value.replace(/\s/g, ''))) {
    return 'رقم هاتف غير صحيح. مثال: 0791234567';
  }
  return null;
};
