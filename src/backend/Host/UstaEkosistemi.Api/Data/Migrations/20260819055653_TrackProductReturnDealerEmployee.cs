using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class TrackProductReturnDealerEmployee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ReturnedByDealerEmployeeId",
                table: "ProductCodes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductCodes_ReturnedByDealerEmployeeId",
                table: "ProductCodes",
                column: "ReturnedByDealerEmployeeId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductCodes_DealerEmployees_ReturnedByDealerEmployeeId",
                table: "ProductCodes",
                column: "ReturnedByDealerEmployeeId",
                principalTable: "DealerEmployees",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductCodes_DealerEmployees_ReturnedByDealerEmployeeId",
                table: "ProductCodes");

            migrationBuilder.DropIndex(
                name: "IX_ProductCodes_ReturnedByDealerEmployeeId",
                table: "ProductCodes");

            migrationBuilder.DropColumn(
                name: "ReturnedByDealerEmployeeId",
                table: "ProductCodes");
        }
    }
}
