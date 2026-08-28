using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRedemptionIdempotency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "RedemptionRequestId",
                table: "ProductCodes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductCodes_RedemptionRequestId",
                table: "ProductCodes",
                column: "RedemptionRequestId",
                unique: true,
                filter: "[RedemptionRequestId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProductCodes_RedemptionRequestId",
                table: "ProductCodes");

            migrationBuilder.DropColumn(
                name: "RedemptionRequestId",
                table: "ProductCodes");
        }
    }
}
