using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRewardRedemptionIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RedemptionRequestId",
                table: "RewardRedemptions",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_RewardRedemptions_RedemptionRequestId",
                table: "RewardRedemptions",
                column: "RedemptionRequestId",
                unique: true,
                filter: "[RedemptionRequestId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_RewardRedemptions_RedemptionRequestId",
                table: "RewardRedemptions");

            migrationBuilder.DropColumn(
                name: "RedemptionRequestId",
                table: "RewardRedemptions");
        }
    }
}
