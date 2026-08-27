using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;
using UstaEkosistemi.Api.Controllers;
using UstaEkosistemi.Api.Security;

namespace UstaEkosistemi.Api.Tests;

public sealed class AuthorizationIsolationTests
{
    [Fact]
    public async Task Craftsman_session_cannot_open_another_craftsmans_route()
    {
        await using var db = CreateDb();
        var owner = new Craftsman { PhoneNumber = "905550000001", FullName = "Birinci Usta" };
        var other = new Craftsman { PhoneNumber = "905550000002", FullName = "İkinci Usta" };
        db.AddRange(owner, other, new CraftsmanSession { Craftsman = owner, TokenHash = CraftsmanSessionSecurity.HashToken("owner-token"), ExpiresAtUtc = DateTimeOffset.UtcNow.AddHours(1) });
        await db.SaveChangesAsync();

        var context = new DefaultHttpContext();
        context.Request.Path = $"/api/craftsmen/{other.Id}/wallet";
        context.Request.Headers.Authorization = "Bearer owner-token";
        var nextCalled = false;
        await new CraftsmanAuthenticationMiddleware(_ => { nextCalled = true; return Task.CompletedTask; }).InvokeAsync(context, db);

        Assert.Equal(StatusCodes.Status403Forbidden, context.Response.StatusCode);
        Assert.False(nextCalled);
    }

    [Fact]
    public async Task Missing_craftsman_session_is_rejected_before_controller()
    {
        await using var db = CreateDb();
        var context = new DefaultHttpContext();
        context.Request.Path = $"/api/craftsmen/{Guid.NewGuid()}/dashboard";
        var nextCalled = false;
        await new CraftsmanAuthenticationMiddleware(_ => { nextCalled = true; return Task.CompletedTask; }).InvokeAsync(context, db);

        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
        Assert.False(nextCalled);
    }

    [Fact]
    public async Task Missing_admin_session_is_rejected_before_controller()
    {
        await using var db = CreateDb();
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/admin/overview";
        var nextCalled = false;
        await new AdminAuthenticationMiddleware(_ => { nextCalled = true; return Task.CompletedTask; }).InvokeAsync(context, db);

        Assert.Equal(StatusCodes.Status401Unauthorized, context.Response.StatusCode);
        Assert.False(nextCalled);
    }

    [Fact]
    public async Task Missing_dealer_session_cannot_read_dealer_activity()
    {
        await using var db = CreateDb();
        var controller = new DealerActivityController(db, new DealerSessionAuthenticator(db));
        controller.ControllerContext = new Microsoft.AspNetCore.Mvc.ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Get(null, 100, CancellationToken.None);

        Assert.IsType<Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult>(result);
    }

    private static UstaEkosistemiDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<UstaEkosistemiDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new UstaEkosistemiDbContext(options);
    }
}
