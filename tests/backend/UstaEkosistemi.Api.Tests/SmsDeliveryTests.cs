using Microsoft.Extensions.Logging.Abstractions;
using UstaEkosistemi.Api.Sms;

namespace UstaEkosistemi.Api.Tests;

public sealed class SmsDeliveryTests
{
    [Fact]
    public async Task Development_delivery_completes_without_an_external_provider()
    {
        var delivery = new DevelopmentSmsDelivery(NullLogger<DevelopmentSmsDelivery>.Instance);
        await delivery.SendOtpAsync("905550000000", "123456", CancellationToken.None);
    }

    [Fact]
    public async Task Unconfigured_production_delivery_fails_explicitly()
    {
        var delivery = new UnconfiguredSmsDelivery();
        await Assert.ThrowsAsync<SmsProviderNotConfiguredException>(() => delivery.SendOtpAsync("905550000000", "123456", CancellationToken.None));
    }
}
