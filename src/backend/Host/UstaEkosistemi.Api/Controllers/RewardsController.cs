using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UstaEkosistemi.Api.Data;
using UstaEkosistemi.Api.Domain;

namespace UstaEkosistemi.Api.Controllers;

[ApiController]
[Route("api/rewards")]
public sealed class RewardsController(UstaEkosistemiDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCatalog(RewardDeliveryType? deliveryType, CancellationToken cancellationToken)
    {
        var query = dbContext.Rewards.AsNoTracking().Where(x => x.IsActive);
        if (deliveryType.HasValue)
        {
            query = query.Where(x => x.DeliveryType == deliveryType.Value);
        }

        var rewards = await query.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Description,
                x.PointCost,
                deliveryType = x.DeliveryType.ToString(),
                x.ImageKey,
                x.StockQuantity,
                isAvailable = x.StockQuantity == null || x.StockQuantity > 0
            })
            .ToListAsync(cancellationToken);

        return Ok(rewards);
    }
}
