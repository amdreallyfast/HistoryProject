using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class OptionalEventImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Images_EventImageId",
                table: "Events");

            migrationBuilder.AlterColumn<Guid>(
                name: "EventImageId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Images_EventImageId",
                table: "Events",
                column: "EventImageId",
                principalTable: "Images",
                principalColumn: "Id");

            // Data: "no image" used to be stored as an Images row with empty bytes (the column
            // was NOT NULL). It is now EventImageId = NULL. Unlink those rows, then delete them.
            // Real images are untouched.
            migrationBuilder.Sql(@"
UPDATE Events SET EventImageId = NULL
WHERE EventImageId IN (SELECT Id FROM Images WHERE DATALENGTH(ImageBinary) = 0);");
            migrationBuilder.Sql(@"
DELETE FROM Images
WHERE DATALENGTH(ImageBinary) = 0
  AND Id NOT IN (SELECT EventImageId FROM Events WHERE EventImageId IS NOT NULL);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Images_EventImageId",
                table: "Events");

            // Data: give every imageless event its own empty-bytes Images row again, since the
            // column goes back to NOT NULL. (Before, a chain shared one; one per event is
            // equivalent for reads.) MD5 of zero bytes, lowercase hex, as EventImage computes it.
            migrationBuilder.Sql(@"
UPDATE Events SET EventImageId = NEWID() WHERE EventImageId IS NULL;
INSERT INTO Images (Id, ImageBinary, ImageMD5Hash)
SELECT e.EventImageId, 0x, 'd41d8cd98f00b204e9800998ecf8427e'
FROM Events e
WHERE NOT EXISTS (SELECT 1 FROM Images i WHERE i.Id = e.EventImageId);");

            migrationBuilder.AlterColumn<Guid>(
                name: "EventImageId",
                table: "Events",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Images_EventImageId",
                table: "Events",
                column: "EventImageId",
                principalTable: "Images",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
