using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    public partial class FirstEdition : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Images",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ImageBinary = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    ImageMD5Hash = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Images", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Revision = table.Column<int>(type: "int", nullable: false),
                    RevisionDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevisionAuthor = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    EventImageId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(2048)", maxLength: 2048, nullable: false),
                    LBYear = table.Column<int>(type: "int", nullable: false),
                    LBMonth = table.Column<int>(type: "int", nullable: true),
                    LBDay = table.Column<int>(type: "int", nullable: true),
                    LBHour = table.Column<int>(type: "int", nullable: true),
                    LBMin = table.Column<int>(type: "int", nullable: true),
                    UBYear = table.Column<int>(type: "int", nullable: false),
                    UBMonth = table.Column<int>(type: "int", nullable: true),
                    UBDay = table.Column<int>(type: "int", nullable: true),
                    UBHour = table.Column<int>(type: "int", nullable: true),
                    UBMin = table.Column<int>(type: "int", nullable: true),
                    SpecificLocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_Images_EventImageId",
                        column: x => x.EventImageId,
                        principalTable: "Images",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EventTag",
                columns: table => new
                {
                    EventsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TagsId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventTag", x => new { x.EventsId, x.TagsId });
                    table.ForeignKey(
                        name: "FK_EventTag_Events_EventsId",
                        column: x => x.EventsId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventTag_Tags_TagsId",
                        column: x => x.TagsId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Locations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Latitude = table.Column<double>(type: "float", nullable: false),
                    Longitude = table.Column<double>(type: "float", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Locations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Locations_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Sources",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ISBN = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Title = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Where = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    PublicationLBYear = table.Column<int>(type: "int", nullable: false),
                    PublicationLBMonth = table.Column<int>(type: "int", nullable: true),
                    PublicationLBDay = table.Column<int>(type: "int", nullable: true),
                    PublicationUBYear = table.Column<int>(type: "int", nullable: false),
                    PublicationUBMonth = table.Column<int>(type: "int", nullable: true),
                    PublicationUBDay = table.Column<int>(type: "int", nullable: true),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sources", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Sources_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "SourceAuthors",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    EventSourceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SourceAuthors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SourceAuthors_Sources_EventSourceId",
                        column: x => x.EventSourceId,
                        principalTable: "Sources",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_EventImageId",
                table: "Events",
                column: "EventImageId");

            migrationBuilder.CreateIndex(
                name: "IX_Events_SpecificLocationId",
                table: "Events",
                column: "SpecificLocationId");

            migrationBuilder.CreateIndex(
                name: "IX_EventTag_TagsId",
                table: "EventTag",
                column: "TagsId");

            migrationBuilder.CreateIndex(
                name: "IX_Locations_EventId",
                table: "Locations",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_SourceAuthors_EventSourceId",
                table: "SourceAuthors",
                column: "EventSourceId");

            migrationBuilder.CreateIndex(
                name: "IX_Sources_EventId",
                table: "Sources",
                column: "EventId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Locations_SpecificLocationId",
                table: "Events",
                column: "SpecificLocationId",
                principalTable: "Locations",
                principalColumn: "Id");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Images_EventImageId",
                table: "Events");

            migrationBuilder.DropForeignKey(
                name: "FK_Events_Locations_SpecificLocationId",
                table: "Events");

            migrationBuilder.DropTable(
                name: "EventTag");

            migrationBuilder.DropTable(
                name: "SourceAuthors");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Sources");

            migrationBuilder.DropTable(
                name: "Images");

            migrationBuilder.DropTable(
                name: "Locations");

            migrationBuilder.DropTable(
                name: "Events");
        }
    }
}
