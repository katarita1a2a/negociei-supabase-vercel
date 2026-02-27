
/**
 * Formats a numeric value into BRL currency string (e.g., 1234.56 -> "1.234,56")
 */
export const formatCurrencyBRL = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value || 0);
};

/**
 * Parses a BRL currency string into a number.
 * It ignores dots and treats the comma as a decimal separator.
 * Example: "1.234,56" -> 1234.56
 * Example: "1000" -> 1000
 */
export const parseCurrencyBRL = (formatted: string): number => {
    if (!formatted) return 0;
    // Remove thousands points, replace comma with dot
    const cleanValue = formatted
        .replace(/\./g, '')
        .replace(',', '.');

    const numeric = parseFloat(cleanValue);
    return isNaN(numeric) ? 0 : numeric;
};

/**
 * Masks an input string to BRL format as the user types, but in a "natural" way.
 * Typing "1000" becomes "1.000". Typing "1000,5" becomes "1.000,5".
 * It does not force 2 decimals until the user types them.
 */
export const maskCurrencyBRL = (value: string): string => {
    if (!value) return "";

    // Remove everything except digits and comma
    let cleanValue = value.replace(/[^\d,]/g, '');

    // Ensure only one comma exists
    const commaIndex = cleanValue.indexOf(',');
    if (commaIndex !== -1) {
        cleanValue = cleanValue.slice(0, commaIndex + 1) +
            cleanValue.slice(commaIndex + 1).replace(/,/g, '');
    }

    // Split integer and decimal parts
    const parts = cleanValue.split(',');
    let integerPart = parts[0];
    const decimalPart = parts[1];

    // Format integer part with thousands dots
    if (integerPart) {
        const number = parseInt(integerPart, 10);
        if (!isNaN(number)) {
            integerPart = new Intl.NumberFormat('pt-BR').format(number);
        } else {
            integerPart = "";
        }
    }

    // Reconstruct
    if (parts.length > 1) {
        return `${integerPart},${decimalPart.slice(0, 2)}`; // Limit to 2 decimals
    }

    return integerPart;
};
