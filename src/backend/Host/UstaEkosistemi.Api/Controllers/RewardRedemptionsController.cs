using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/craftsmen/{craftsmanId:guid}/reward-redemptions")]
public sealed class RewardRedemptionsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetMine(Guid craftsmanId, CancellationToken cancellationToken)
    {
        if (!await dbContext.Craftsmen.AnyAsync(x => x.Id == craftsmanId, cancellationToken))
        {
            return NotFound(new { message = "Usta bulunamadı." });
        }

        var redemptions = await dbContext.RewardRedemptions.AsNoTracking()
            .Where(x => x.CraftsmanId == craftsmanId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new
            {
                x.Id,
                rewardName = x.Reward.Name,
                imageKey = x.Reward.ImageKey,
                deliveryType = x.Reward.DeliveryType.ToString(),
                status = x.Status.ToString(),
                x.PointsSpent,
                x.FulfillmentCode,
                x.CreatedAtUtc,
                x.ExpiresAtUtc,
                x.FulfilledAtUtc,
                fulfilledByDealerEmployee = x.FulfilledByDealerEmployee == null ? null : x.FulfilledByDealerEmployee.FullName,
                fulfilledByDealer = x.FulfilledByDealerEmployee == null ? null : x.FulfilledByDealerEmployee.Dealer.Name
            })
            .ToListAsync(cancellationToken);

        return Ok(redemptions);
    }
}
