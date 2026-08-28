using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using UstaEkosistemi.Api.Observability;

namespace UstaEkosistemi.Api.Tests;

public sealed class RequestCorrelationMiddlewareTests
{
    [Fact]
    public async Task Safe_client_correlation_id_is_returned_and_available_to_request_code()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers[RequestCorrelationMiddleware.HeaderName] = "pilot-qr-001";
        string? seenByRequest = null;
        var middleware = new RequestCorrelationMiddleware(_ =>
        {
            seenByRequest = CorrelationContext.Current;
            return Task.CompletedTask;
        }, NullLogger<RequestCorrelationMiddleware>.Instance);

        await middleware.Invoke(context);

        Assert.Equal("pilot-qr-001", context.Response.Headers[RequestCorrelationMiddleware.HeaderName]);
        Assert.Equal("pilot-qr-001", seenByRequest);
        Assert.Null(CorrelationContext.Current);
    }

    [Fact]
    public async Task Unsafe_client_correlation_id_is_replaced()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers[RequestCorrelationMiddleware.HeaderName] = "<script>bad</script>";
        var middleware = new RequestCorrelationMiddleware(_ => Task.CompletedTask, NullLogger<RequestCorrelationMiddleware>.Instance);

        await middleware.Invoke(context);

        var generated = context.Response.Headers[RequestCorrelationMiddleware.HeaderName].ToString();
        Assert.NotEmpty(generated);
        Assert.NotEqual("<script>bad</script>", generated);
        Assert.Matches("^[A-Za-z0-9_-]{1,64}$", generated);
    }
}
