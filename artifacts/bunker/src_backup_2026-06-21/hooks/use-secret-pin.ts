const PIN_KEY = "bunker_archive_pin";

function hashPin(pin: string): string {
  return btoa(`bunker:${pin}:secure`);
}

export function useSecretPin() {
  const hasPinSet = () => !!localStorage.getItem(PIN_KEY);

  const setPin = (pin: string) => {
    localStorage.setItem(PIN_KEY, hashPin(pin));
  };

  const verifyPin = (pin: string): boolean => {
    const stored = localStorage.getItem(PIN_KEY);
    return stored === hashPin(pin);
  };

  const clearPin = () => localStorage.removeItem(PIN_KEY);

  return { hasPinSet, setPin, verifyPin, clearPin };
}
