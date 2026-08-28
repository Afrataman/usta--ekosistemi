using System.Diagnostics;

namespace UstaEkosistemi.Api.Observability;

public sealed class RequestCorrelationMiddleware(RequestDelegate next, ILogger<RequestCorrelationMiddleware> logger)
{
    public const string HeaderName = "X-Correlation-Id";
    public const string ItemName = "CorrelationId";

    public async Task Invoke(HttpContext context)
    {
        var requestedId = context.Request.Headers[HeaderName].FirstOrDefault();
        var correlationId = IsSafe(requestedId) ? requestedId! : Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString("N");
        context.Items[ItemName] = correlationId;
        context.Response.Headers[HeaderName] = correlationId;
        var stopwatch = Stopwatch.StartNew();
        var previousCorrelationId = CorrelationContext.Current;
        CorrelationContext.Current = correlationId;
        using (logger.BeginScope("CorrelationId:{CorrelationId}", correlationId))
        {
            try { await next(context); }
            finally { CorrelationContext.Current = previousCorrelationId; logger.LogInformation("HTTP {Method} {Path} => {StatusCode} in {ElapsedMs}ms", context.Request.Method, context.Request.Path, context.Response.StatusCode, stopwatch.ElapsedMilliseconds); }
        }
    }

    private static bool IsSafe(string? value) => !string.IsNullOrWhiteSpace(value) && value.Length <= 64 && value.All(character => char.IsLetterOrDigit(character) || character is '-' or '_');
}
