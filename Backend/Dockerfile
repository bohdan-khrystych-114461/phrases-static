FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5002

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["PhraseLearner.Api/PhraseLearner.Api.csproj", "./"]
RUN dotnet restore "PhraseLearner.Api.csproj"
COPY PhraseLearner.Api/ .
RUN dotnet build "PhraseLearner.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "PhraseLearner.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS=http://+:5002
ENTRYPOINT ["dotnet", "PhraseLearner.Api.dll"]
