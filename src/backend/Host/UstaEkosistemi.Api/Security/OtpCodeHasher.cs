using System.Security.Cryptography;

namespace UstaEkosistemi.Api.Security;

public static class OtpCodeHasher
{
    public static (string Hash, string Salt) Hash(string code)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(code, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    public static bool Verify(string code, string expectedHash, string salt)
    {
        var actual = Rfc2898DeriveBytes.Pbkdf2(code, Convert.FromBase64String(salt), 100_000, HashAlgorithmName.SHA256, 32);
        return CryptographicOperations.FixedTimeEquals(actual, Convert.FromBase64String(expectedHash));
    }
}
