using System.Security.Cryptography;
using System.Text;

namespace UstaEkosistemi.Api.Security;

public static class ProductCodeHasher
{
    public static string Hash(string code)
    {
        var normalizedCode = code.Trim().ToUpperInvariant();
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalizedCode)));
    }
}
