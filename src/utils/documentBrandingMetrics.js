const deepFreeze = (value) => {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.getOwnPropertyNames(value).forEach((key) => {
    deepFreeze(value[key]);
  });

  return Object.freeze(value);
};

// Metricas documentales locales del repo frontend.
// Si backend necesita la misma regla visual, debe mantener su propia implementacion.
export const institutionalLetterheadMetrics = deepFreeze({
  print: {
    sheetPadding: "13mm 14mm 14mm",
    pageTopPadding: "13mm",
    pageBottomPadding: "14mm",
    pageHorizontalPadding: "14mm",
    multipageHeaderSpacerHeight: "39mm",
    multipageFooterSpacerHeight: "36mm",
    headerColumns: "minmax(0, 0.52fr) minmax(0, 0.48fr)",
    headerGap: "8mm",
    headerPaddingBottom: "4.2mm",
    headerBorderWidth: "1.2mm",
    brandRowColumns: "34mm minmax(0, 1fr)",
    brandRowGap: "3.6mm",
    brandCopyGap: "2mm",
    logoWidth: "34mm",
    logoHeight: "20mm",
    logoRadius: "4mm",
    logoBorderWidth: "0.3mm",
    brandCompanyFontSize: "10.8pt",
    brandCompanyLineHeight: "1.14",
    taxIdGap: "2mm",
    taxIdPadding: "1.7mm 3.4mm",
    taxIdFontSize: "8pt",
    phraseColumnMinHeight: "20mm",
    phraseMinHeight: "18mm",
    phrasePadding: "1.5mm 1.5mm",
    phraseFontSize: "10.1pt",
    phraseLineHeight: "1.3",
    footerPaddingTop: "4mm",
    footerColumns: "minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 0.95fr)",
    footerGap: "3mm 4mm",
    footerContactPadding: "0.6mm 0",
    footerIconSize: "6.5mm",
    footerValueFontSize: "8.3pt",
    footerValueLineHeight: "1.4",
    footerCopyMarginTop: "2.5mm",
    footerCopyFontSize: "9pt",
    footerCopyLineHeight: "1.5",
  },
  preview: {
    canvasPadding: {
      base: "20px",
      md: "32px",
      lg: "36px",
    },
    headerGap: {
      base: "20px",
      lg: "32px",
    },
    headerPaddingBottom: "16px",
    brandRowGap: "16px",
    brandCompanyMaxWidth: "260px",
    logoWidth: {
      base: "96px",
      md: "118px",
    },
    logoHeight: {
      base: "58px",
      md: "68px",
    },
    logoRadius: "16px",
    logoPadding: "10px",
    brandCopyGap: "8px",
    brandCompanyFontSize: {
      base: "15px",
      md: "18px",
    },
    brandTaxIdPadding: "6px 12px",
    brandTaxIdFontSize: "11px",
    phraseMinHeight: {
      base: "72px",
      md: "84px",
    },
    phrasePadding: {
      base: "8px 12px",
      md: "8px 16px",
    },
    phraseFontSize: {
      base: "13px",
      md: "15px",
    },
    bodyMarginTop: "12px",
    bodyPadding: "8px 4px",
    bodyInnerPadding: "12px",
    footerMarginTop: "14px",
    footerPaddingTop: "12px",
    footerGridGap: "12px 16px",
    footerContactsPaddingTop: "4px",
    footerCommentMarginTop: "10px",
    footerCommentPadding: "6px 16px",
  },
});

export const formalDocumentMetrics = deepFreeze({
  sheetPadding: "28px",
  sheetRadius: "18px",
  headerGap: "20px",
  headerPaddingBottom: "18px",
  brandGap: "16px",
  brandStackWidth: "96px",
  logoSize: "96px",
  logoRadius: "20px",
  taxIdMarginTop: "10px",
  taxIdPadding: "8px 10px",
  taxIdRadius: "14px",
  taxIdFontSize: "11px",
  eyebrowMarginBottom: "6px",
  eyebrowFontSize: "11px",
  titleFontSize: "29px",
  titleLineHeight: "1.15",
  headerSideMinWidth: "260px",
  headerSideMaxWidth: "320px",
  headerSideGap: "12px",
  taglinePadding: "14px 16px",
  taglineRadius: "16px",
  taglineFontSize: "14px",
  taglineLineHeight: "1.45",
  dataLineMarginBottom: "4px",
  dataLineFontSize: "12px",
  documentBoxMinWidth: "240px",
  documentBoxRadius: "16px",
  documentBoxPadding: "14px 16px",
  documentBoxLabelFontSize: "11px",
  documentBoxValueFontSize: "16px",
  footerMarginTop: "24px",
  footerPaddingTop: "18px",
  footerContactsGap: "12px",
  footerContactPadding: "10px 12px",
  footerContactRadius: "14px",
  footerContactLabelFontSize: "10px",
  footerContactValueFontSize: "12px",
  footerCopyMarginTop: "12px",
  footerMetaMarginTop: "10px",
});
