using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebAPI.Migrations
{
    public partial class ChangeDepartmentAndEmployeeToUseEF : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Departments_DepartmentId",
                table: "Employees");

            migrationBuilder.RenameColumn(
                name: "EmployeeName",
                table: "Employees",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "EmployeeId",
                table: "Employees",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "DepartmentName",
                table: "Departments",
                newName: "Name");

            //migrationBuilder.RenameColumn(
            //    name: "DepartmentId",
            //    table: "Departments",
            //    newName: "Id");

            // Rename Department primary key without loss.
            // Add tempt column
            // -> move values
            // -> drop old column
            // -> add new identity column
            // -> move temp values to new column
            // -> drop temp column
            // -> set new column as primary key.
            migrationBuilder.AddColumn<int>(
                name: "TempId",
                table: "Departments",
                type: "int",
                nullable: true,
                defaultValue: 0);
            migrationBuilder.Sql("UPDATE Departments SET TempId = DepartmentId");
            migrationBuilder.DropPrimaryKey(
                name: "PK_Departments",
                table: "Departments");
            migrationBuilder.DropColumn(
                name: "DepartmentId",
                table: "Departments");

            migrationBuilder.AddColumn<int>(
                name: "Id",
                table: "Departments",
                type: "int",
                nullable: true,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.Sql("UPDATE Departments SET Id = TempId");
            migrationBuilder.AddPrimaryKey(
                name: "PK_Departments",
                table: "Departments",
                column: "Id");
            migrationBuilder.DropColumn(
                name: "TempId",
                table: "Departments");




            //migrationBuilder.AlterColumn<int>(
            //    name: "DepartmentId",
            //    table: "Employees",
            //    type: "int",
            //    nullable: false,
            //    defaultValue: 0,
            //    oldClrType: typeof(int),
            //    oldType: "int",
            //    oldNullable: true);

            //migrationBuilder.AddForeignKey(
            //    name: "FK_Employees_Departments_DepartmentId",
            //    table: "Employees",
            //    column: "DepartmentId",
            //    principalTable: "Departments",
            //    principalColumn: "Id",
            //    onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Departments_DepartmentId",
                table: "Employees",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "DepartmentId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Employees_Departments_DepartmentId",
                table: "Employees");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Employees",
                newName: "EmployeeName");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "Employees",
                newName: "EmployeeId");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "Departments",
                newName: "DepartmentName");

            //migrationBuilder.RenameColumn(
            //    name: "Id",
            //    table: "Departments",
            //    newName: "DepartmentId");

            // Rename Department primary key without loss.
            migrationBuilder.AddColumn<int>(
                name: "DepartmentId",
                table: "Departments",
                type: "int",
                nullable: false,
                defaultValue: 0)
                .Annotation("SqlServer:Identity", "1, 1");
            migrationBuilder.Sql("UPDATE Departments SET DepartmentId = Id");
            migrationBuilder.DropPrimaryKey(
                name: "PK_Deparments",
                table: "Departments");
            migrationBuilder.DropColumn(
                name: "Id",
                table: "Departments");
            migrationBuilder.AddPrimaryKey(
                name: "PK_Departments",
                table: "Departments",
                column: "DepartmentId");


            //migrationBuilder.AlterColumn<int>(
            //    name: "DepartmentId",
            //    table: "Employees",
            //    type: "int",
            //    nullable: true,
            //    oldClrType: typeof(int),
            //    oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Employees_Departments_DepartmentId",
                table: "Employees",
                column: "DepartmentId",
                principalTable: "Departments",
                principalColumn: "DepartmentId");
        }
    }
}
