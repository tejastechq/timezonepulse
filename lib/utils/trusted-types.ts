import DOMPurify from 'dompurify';

if (typeof window !== 'undefined') {
  // Create default trusted types policy
  if (window.trustedTypes) {
    window.trustedTypes.createPolicy('default', {
      createHTML: (string) => DOMPurify.sanitize(string, { RETURN_TRUSTED_TYPE: true }),
      createScript: (string) => string,
      createScriptURL: (string) => string
    });
  }
}