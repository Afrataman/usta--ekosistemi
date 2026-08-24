namespace UstaEkosistemi.Api.Sms;

public interface ISmsDelivery
{
    Task SendOtpAsync(string phoneNumber, string code, CancellationToken cancellationToken);
}

public sealed class DevelopmentSmsDelivery(ILogger<DevelopmentSmsDelivery> logger) : ISmsDelivery
{
    public Task SendOtpAsync(string phoneNumber, string code, CancellationToken cancellationToken)
    {
        logger.LogInformation("Development OTP for {PhoneNumber}: {Code}", phoneNumber, code);
        return Task.CompletedTask;
    }
}

public sealed class SmsProviderNotConfiguredException : Exception
{
    public SmsProviderNotConfiguredException() : base("SMS sağlayıcısı yapılandırılmadı.") { }
}

public sealed class UnconfiguredSmsDelivery : ISmsDelivery
{
    public Task SendOtpAsync(string phoneNumber, string code, CancellationToken cancellationToken) => throw new SmsProviderNotConfiguredException();
}
