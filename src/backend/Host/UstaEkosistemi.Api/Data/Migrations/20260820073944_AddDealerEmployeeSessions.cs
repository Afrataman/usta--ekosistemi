using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDealerEmployeeSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PinHash",
                table: "DealerEmployees",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PinSalt",
                table: "DealerEmployees",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "DealerSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DealerEmployeeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "nchar(64)", fixedLength: true, maxLength: 64, nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    RevokedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DealerSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DealerSessions_DealerEmployees_DealerEmployeeId",
                        column: x => x.DealerEmployeeId,
                        principalTable: "DealerEmployees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DealerSessions_DealerEmployeeId_ExpiresAtUtc",
                table: "DealerSessions",
                columns: new[] { "DealerEmployeeId", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_DealerSessions_TokenHash",
                table: "DealerSessions",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DealerSessions");

            migrationBuilder.DropColumn(
                name: "PinHash",
                table: "DealerEmployees");

            migrationBuilder.DropColumn(
                name: "PinSalt",
                table: "DealerEmployees");
        }
    }
}
