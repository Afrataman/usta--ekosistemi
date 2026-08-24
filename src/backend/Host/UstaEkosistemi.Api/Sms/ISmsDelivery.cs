using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using Microsoft.Extensions.Options;

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

public class SmsDeliveryException(string message) : Exception(message);
public sealed class SmsProviderNotConfiguredException : SmsDeliveryException
{
    public SmsProviderNotConfiguredException() : base("SMS sağlayıcısı yapılandırılmadı.") { }
}

public sealed class UnconfiguredSmsDelivery : ISmsDelivery
{
    public Task SendOtpAsync(string phoneNumber, string code, CancellationToken cancellationToken) => throw new SmsProviderNotConfiguredException();
}

public sealed class NetGsmOptions
{
    public string UserName { get; init; } = "";
    public string Password { get; init; } = "";
    public string SenderId { get; init; } = "";
    public bool IsConfigured => !string.IsNullOrWhiteSpace(UserName) && !string.IsNullOrWhiteSpace(Password) && !string.IsNullOrWhiteSpace(SenderId);
}

public sealed class NetGsmSmsDelivery(HttpClient httpClient, IOptions<NetGsmOptions> options, ILogger<NetGsmSmsDelivery> logger) : ISmsDelivery
{
    private const string OtpEndpoint = "https://api.netgsm.com.tr/sms/rest/v2/otp";

    public async Task SendOtpAsync(string phoneNumber, string code, CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (!settings.IsConfigured) throw new SmsProviderNotConfiguredException();
        var recipient = ToNetGsmRecipient(phoneNumber);
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{settings.UserName}:{settings.Password}"));
        using var request = new HttpRequestMessage(HttpMethod.Post, OtpEndpoint)
        {
            Content = JsonContent.Create(new { msgheader = settings.SenderId, msg = $"Usta Kulübü doğrulama kodunuz: {code}. Kod 3 dakika geçerlidir.", no = recipient })
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            var result = await response.Content.ReadFromJsonAsync<NetGsmResult>(cancellationToken: cancellationToken);
            if (!response.IsSuccessStatusCode || result?.Code != "00") throw new SmsDeliveryException("SMS sağlayıcısı doğrulama kodunu kabul etmedi.");
            logger.LogInformation("OTP SMS queued by Netgsm. JobId: {JobId}", result.JobId);
        }
        catch (HttpRequestException)
        {
            throw new SmsDeliveryException("SMS sağlayıcısına ulaşılamadı.");
        }
    }

    private static string ToNetGsmRecipient(string phoneNumber)
    {
        var digits = new string(phoneNumber.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("90")) digits = digits[2..];
        if (digits.StartsWith('0')) digits = digits[1..];
        if (digits.Length != 10 || !digits.StartsWith('5')) throw new SmsDeliveryException("SMS için geçerli Türkiye telefon numarası gerekli.");
        return digits;
    }

    private sealed record NetGsmResult(string? JobId, string? Code, string? Description);
}
