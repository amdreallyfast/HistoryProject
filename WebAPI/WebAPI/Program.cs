using Azure.Identity;
using Azure.Security.KeyVault.Secrets;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

var builder = WebApplication.CreateBuilder(args);

var vaultUri = builder.Configuration.GetValue<String>("KeyVaultAccess:VaultUrl");
var servicePrincipleAppId = builder.Configuration.GetValue<String>("KeyVaultAccess:ServicePrincipleAppId");
var thumbprint = builder.Configuration.GetValue<String>("KeyVaultAccess:Thumbprint");

//// Source:
////  https://learn.microsoft.com/en-us/dotnet/api/overview/azure/extensions.aspnetcore.configuration.secrets-readme
//ConfigurationBuilder thing = new ConfigurationBuilder();
//thing.AddAzureKeyVault(new Uri(vaultUri), new DefaultAzureCredential());
//var config = thing.Build();
//System.Diagnostics.Debug.WriteLine(config["HistoryProject-DB-ConnStr"]);

var certificate = new X509Certificate2(@"C:\Users\coxjohn\.certs\historyProjectCert.pfx", "FabulousAllAround1!");
var loginCredential = new ClientCertificateCredential("4ae6a2f0-4b52-495f-9829-d7a93eaaf17e", "7bd8caf8-bef5-41fd-822a-6fe1e80ebf89", certificate);
var client = new SecretClient(new Uri(vaultUri), loginCredential);
var secretName = "SecretThing";
var secretValue = "ThingsAndSuch";
//await client.SetSecretAsync(secretName, secretValue);
//var secret = await client.GetSecretAsync(secretName);
var secret = await client.GetSecretAsync("HistoryProject-DB-ConnStr");

System.Diagnostics.Debug.WriteLine("things");

//{
//    var store = new X509Store(StoreName.My, StoreLocation.CurrentUser);
//    store.Open(OpenFlags.ReadOnly);
//    //var certCollection = store.Certificates.Find(X509FindType.FindByThumbprint, thumbprint, true);
//    var certCollection = store.Certificates;
//    System.Diagnostics.Debug.WriteLine("things");
//}

//System.Diagnostics.Debug.WriteLine("things");
//System.Diagnostics.Debug.WriteLine("things");
//System.Diagnostics.Debug.WriteLine("things");
//System.Diagnostics.Debug.WriteLine("things");
//System.Diagnostics.Debug.WriteLine("things");

//foreach (StoreLocation storeLocation in (StoreLocation[])
//    Enum.GetValues(typeof(StoreLocation)))
//{
//    foreach (StoreName storeName in (StoreName[])
//        Enum.GetValues(typeof(StoreName)))
//    {
//        X509Store store = new X509Store(storeName, storeLocation);
//        System.Diagnostics.Debug.WriteLine(storeName);
//        try
//        {
//            store.Open(OpenFlags.OpenExistingOnly);

//            System.Diagnostics.Debug.WriteLine("Yes    {0,4}  {1}, {2}",
//                store.Certificates.Count, store.Name, store.Location);
//        }
//        catch (CryptographicException)
//        {
//            System.Diagnostics.Debug.WriteLine("No           {0}, {1}",
//                store.Name, store.Location);
//        }
//    }
//    System.Diagnostics.Debug.WriteLine("");
//}

//X509Certificate GetCertificate(string thumbprint)
//{
//    var 
//}

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
