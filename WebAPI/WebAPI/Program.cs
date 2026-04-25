using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json.Serialization;
using WebAPI;
using WebAPI.Models;

var builder = WebApplication.CreateBuilder(args);

string dbConnStr;
if (builder.Environment.IsDevelopment())
{
    // Local dev: connection string from appsettings.Development.json (gitignored)
    dbConnStr = builder.Configuration.GetConnectionString("LocalDb")
        ?? throw new InvalidOperationException("ConnectionStrings:LocalDb not set in appsettings.Development.json");
}
else
{
    // Azure: Managed Identity authenticates — no password needed
    var sqlServer = builder.Configuration["AzureSql:Server"]
        ?? throw new InvalidOperationException("AzureSql:Server not configured");
    var sqlDb = builder.Configuration["AzureSql:Database"]
        ?? throw new InvalidOperationException("AzureSql:Database not configured");
    dbConnStr = $"Server=tcp:{sqlServer},1433;Database={sqlDb};Authentication=Active Directory Default;Encrypt=True;";
}

// Add services to the container.
builder.Services.AddDbContext<HistoryProjectDbContext>(options =>
{
    options.UseSqlServer(dbConnStr);
});

// Enable CORS (which is useful...how?)
builder.Services.AddCors(corsOptions =>
{
    corsOptions.AddPolicy(name: "AllowOrigin", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

// JSON Serializer
builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(jsonOptions => jsonOptions.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore)
    .AddNewtonsoftJson(jsonOptions => jsonOptions.SerializerSettings.ContractResolver = new DefaultContractResolver());

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseCors(corsPolicyBuilder =>
{
    corsPolicyBuilder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    //app.UseExceptionHandler("/Error");
    //// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    //app.UseHsts();
}

app.UseHttpsRedirection();
app.UseAuthorization();

var photosPath = Path.Combine(Directory.GetCurrentDirectory(), "Photos");
Directory.CreateDirectory(photosPath); // no-op if already exists
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(photosPath),
    RequestPath = "/Photos"
});

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<HistoryProjectDbContext>();
    SeedLocalDbTestData.Initialize(db);
}

app.Run();
