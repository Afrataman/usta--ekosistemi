using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Security;

public static class CraftsmanSessionSecurity
{
    public static string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

public sealed class CraftsmanAuthenticationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, UstaEkosistemiDbContext dbContext)
    {
        if (!context.Request.Path.StartsWithSegments("/api/craftsmen")) { await next(context); return; }
        var authorization = context.Request.Headers.Authorization.ToString();
        if (!authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)) { await Unauthorized(context); return; }
        var hash = CraftsmanSessionSecurity.HashToken(authorization[7..].Trim()); var now = DateTimeOffset.UtcNow;
        var session = await dbContext.CraftsmanSessions.Where(x => x.TokenHash == hash && x.RevokedAtUtc == null && x.ExpiresAtUtc > now && x.Craftsman.IsActive).Select(x => new { x.CraftsmanId }).SingleOrDefaultAsync(context.RequestAborted);
        if (session is null) { await Unauthorized(context); return; }
        var segments = context.Request.Path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments is { Length: >= 3 } && Guid.TryParse(segments[2], out var routeId) && routeId != session.CraftsmanId) { await Forbidden(context); return; }
        context.Items["CraftsmanId"] = session.CraftsmanId;
        await next(context);
    }

    private static async Task Unauthorized(HttpContext context) { context.Response.StatusCode = StatusCodes.Status401Unauthorized; await context.Response.WriteAsJsonAsync(new { message = "Usta oturumu geçersiz veya süresi dolmuş." }); }
    private static async Task Forbidden(HttpContext context) { context.Response.StatusCode = StatusCodes.Status403Forbidden; await context.Response.WriteAsJsonAsync(new { message = "Bu usta hesabına erişim yetkiniz yok." }); }
}
