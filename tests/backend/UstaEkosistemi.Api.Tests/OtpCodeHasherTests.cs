using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class OtpCodeHasherTests
{
    [Fact]
    public void Verify_AcceptsTheOriginalCodeAndRejectsAnotherCode()
    {
        var (hash, salt) = OtpCodeHasher.Hash("123456");

        Assert.True(OtpCodeHasher.Verify("123456", hash, salt));
        Assert.False(OtpCodeHasher.Verify("654321", hash, salt));
    }

    [Fact]
    public void Hash_UsesANewSaltForEveryChallenge()
    {
        var first = OtpCodeHasher.Hash("123456");
        var second = OtpCodeHasher.Hash("123456");

        Assert.NotEqual(first.Salt, second.Salt);
        Assert.NotEqual(first.Hash, second.Hash);
    }
}
