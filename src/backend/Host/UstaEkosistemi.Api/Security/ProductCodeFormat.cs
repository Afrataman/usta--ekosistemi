namespace UstaEkosistemi.Api.Security;

public static class ProductCodeFormat
{
    public static bool IsValid(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return false;
        var normalized = code.Trim().ToUpperInvariant();
        return normalized.Length is >= 8 and <= 80
            && normalized[0] != '-' && normalized[^1] != '-'
            && !normalized.Contains("--", StringComparison.Ordinal)
            && normalized.All(character => character is (>= 'A' and <= 'Z') or (>= '0' and <= '9') or '-');
    }
}
