using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    public partial class FirstMigrationAllModels : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Regions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Regions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Summaries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Summaries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TimeRanges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LowerBoundYear = table.Column<int>(type: "int", nullable: false),
                    LowerBoundMonth = table.Column<int>(type: "int", nullable: true),
                    LowerBoundDay = table.Column<int>(type: "int", nullable: true),
                    LowerBoundHour = table.Column<int>(type: "int", nullable: true),
                    LowerBoundMin = table.Column<int>(type: "int", nullable: true),
                    UpperBoundYear = table.Column<int>(type: "int", nullable: false),
                    UpperBoundMonth = table.Column<int>(type: "int", nullable: true),
                    UpperBoundDay = table.Column<int>(type: "int", nullable: true),
                    UpperBoundHour = table.Column<int>(type: "int", nullable: true),
                    UpperBoundMin = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TimeRanges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    EventRegionId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_Regions_EventRegionId",
                        column: x => x.EventRegionId,
                        principalTable: "Regions",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    RevisionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RevisionDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevisionAuthor = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    ImageFilePath = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    SummaryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TimeRangeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RegionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.RevisionId);
                    table.ForeignKey(
                        name: "FK_Events_Regions_RegionId",
                        column: x => x.RegionId,
                        principalTable: "Regions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Events_Summaries_SummaryId",
                        column: x => x.SummaryId,
                        principalTable: "Summaries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Events_TimeRanges_TimeRangeId",
                        column: x => x.TimeRangeId,
                        principalTable: "TimeRanges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_RegionId",
                table: "Events",
                column: "RegionId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SummaryId",
                table: "Events",
                column: "SummaryId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_TimeRangeId",
                table: "Events",
                column: "TimeRangeId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_EventRegionId",
                table: "Locations",
                column: "EventRegionId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "Summaries");

            migrationBuilder.DropTable(
                name: "TimeRanges");

            migrationBuilder.DropTable(
                name: "Regions");
        }
    }
}
