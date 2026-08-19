using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace UstaEkosistemi.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddReportExportAudits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReportExportAudits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReportType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Actor = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    StartsAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    EndsAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    RowCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportExportAudits", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ReportExportAudits_CreatedAtUtc",
                table: "ReportExportAudits",
                column: "CreatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReportExportAudits");
        }
    }
}
