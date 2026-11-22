#!/usr/bin/env bash
# Sets up a local SQL Server for the WebAPI backend on Linux.
#
# What it does (safe to re-run):
#   1. Generates a random SQL Server password, once per machine, stored in
#      ~/.config/historyproject/sql.env (readable only by you, never committed).
#   2. Starts SQL Server 2022 Developer Edition in Docker (container
#      "historyproject-sql", port 1433 on localhost only, data in a Docker volume).
#   3. Stores the connection string in .NET user-secrets for WebAPI, which
#      overrides ConnectionStrings:LocalDb from appsettings.Development.json.
#   4. Applies the EF Core migrations.
#
# Prerequisites: .NET SDK (see global.json), Docker usable without sudo,
# and the dotnet-ef tool (installed automatically if missing).
#
# By running this you accept the SQL Server Developer Edition license
# (ACCEPT_EULA=Y): https://go.microsoft.com/fwlink/?LinkId=746388

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT="$REPO_ROOT/WebAPI/WebAPI/WebAPI.csproj"
CONFIG_DIR="$HOME/.config/historyproject"
ENV_FILE="$CONFIG_DIR/sql.env"
CONTAINER="historyproject-sql"
VOLUME="historyproject-sqldata"
IMAGE="mcr.microsoft.com/mssql/server:2022-latest"
DB_NAME="HistoryProjectDb"

say() { printf '\n==> %s\n' "$*"; }

for cmd in dotnet docker openssl; do
    command -v "$cmd" >/dev/null || { echo "Missing required command: $cmd" >&2; exit 1; }
done
docker info >/dev/null 2>&1 || {
    echo "Docker isn't usable without sudo. Run: sudo usermod -aG docker \$USER, then log out and back in." >&2
    exit 1
}

say "SQL Server password"
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"
if [[ -f "$ENV_FILE" ]]; then
    echo "Using existing password in $ENV_FILE"
else
    # Prefix/suffix guarantee SQL Server's upper/lower/digit/symbol complexity rules.
    (umask 077; printf 'MSSQL_SA_PASSWORD=Hp%s!a1\n' "$(openssl rand -hex 12)" > "$ENV_FILE")
    echo "Generated a new password in $ENV_FILE"
fi
# shellcheck source=/dev/null
source "$ENV_FILE"

say "SQL Server container"
if docker container inspect "$CONTAINER" >/dev/null 2>&1; then
    docker start "$CONTAINER" >/dev/null
    echo "Container $CONTAINER is running"
else
    docker run -d --name "$CONTAINER" --restart unless-stopped \
        --env-file "$ENV_FILE" -e ACCEPT_EULA=Y -e MSSQL_PID=Developer \
        -p 127.0.0.1:1433:1433 -v "$VOLUME:/var/opt/mssql" \
        "$IMAGE" >/dev/null
    echo "Created container $CONTAINER"
fi

# Capture the logs first: piping straight into `grep -q` fails under pipefail.
sql_ready() { local logs; logs="$(docker logs "$CONTAINER" 2>&1)"; [[ "$logs" == *"Recovery is complete"* ]]; }

echo -n "Waiting for SQL Server to accept connections"
for _ in $(seq 1 60); do
    if sql_ready; then
        echo " ready"
        break
    fi
    echo -n "."
    sleep 2
done
sql_ready || {
    echo; echo "SQL Server didn't become ready. Check: docker logs $CONTAINER" >&2
    exit 1
}

say "Connection string in user-secrets"
CONN="Server=localhost,1433;Database=$DB_NAME;User Id=sa;Password=$MSSQL_SA_PASSWORD;TrustServerCertificate=True;"
dotnet user-secrets set "ConnectionStrings:LocalDb" "$CONN" --project "$PROJECT" >/dev/null
echo "Saved ConnectionStrings:LocalDb"

say "EF Core migrations"
export PATH="$HOME/.dotnet/tools:$PATH"
if ! command -v dotnet-ef >/dev/null; then
    dotnet tool install --global dotnet-ef --version "10.0.*"
fi
ASPNETCORE_ENVIRONMENT=Development dotnet ef database update --project "$PROJECT" 2>&1 | tail -1

say "Done"
echo "Start the backend with:  cd WebAPI/WebAPI && dotnet run --launch-profile WebAPI"
echo "Swagger UI:              https://localhost:7121/swagger"
