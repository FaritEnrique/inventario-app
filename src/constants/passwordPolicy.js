export const PASSWORD_POLICY = Object.freeze({
  minLength: 8,
  maxLength: 72,
});

export const PASSWORD_POLICY_MESSAGE =
  "La contrasena debe tener entre 8 y 72 caracteres e incluir al menos una letra y un numero.";

export const isPasswordPolicyValid = (password) => {
  const normalizedPassword = String(password || "");
  return (
    normalizedPassword.length >= PASSWORD_POLICY.minLength &&
    normalizedPassword.length <= PASSWORD_POLICY.maxLength &&
    /[A-Za-z]/.test(normalizedPassword) &&
    /\d/.test(normalizedPassword)
  );
};
