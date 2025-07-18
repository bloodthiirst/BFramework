var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

string corsProfile = "Allow Developement Requests";

builder.Services.AddCors(options =>
{
    options.AddPolicy(corsProfile, policy =>
    {
        policy.WithOrigins("https://localhost:7101");
    });
});

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(corsProfile);

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
