using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

var builder = WebApplication.CreateBuilder(args);

var tenantId = builder.Configuration.GetValue<String>("KeyVaultAccess:TenantId");
var appId = builder.Configuration.GetValue<String>("KeyVaultAccess:AppId");
var vaultUri = builder.Configuration.GetValue<String>("KeyVaultAccess:VaultUrl");
var secretName = builder.Configuration.GetValue<String>("KeyVaultAccess:SecretName");

var certStore = new X509Store(StoreLocation.CurrentUser);
certStore.Open(OpenFlags.ReadOnly);
var certsByName = certStore.Certificates.Find(X509FindType.FindBySubjectName, "derblarglewhatever", false);
if (certsByName.Count == 0)
{
    throw new Exception("no certificate available");
}

var cert = certsByName.First();

var loginCredential = new ClientCertificateCredential(tenantId, appId, cert);
var client = new SecretClient(new Uri(vaultUri), loginCredential);
var response = await client.GetSecretAsync(secretName);
var rawResponse = response.GetRawResponse();
if (rawResponse.Status != 200)
{
    throw new Exception($"Could not get secret '{secretName}' from key vault. Response code: '{rawResponse.Status}', reason: '{rawResponse.ReasonPhrase}'");
}

var keyVaultSecret = response.Value;
var dbConnStr = keyVaultSecret.Value;

System.Diagnostics.Debug.WriteLine(dbConnStr);

// Add services to the container.
builder.Services.AddRazorPages();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapRazorPages();

app.Run();
