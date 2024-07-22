#!/bin/bash
set -e

# Generate userlist.txt file
echo "\"$POSTGRES_USER\" \"md5$(echo -n "${POSTGRES_PASSWORD}${POSTGRES_USER}" | md5sum | cut -d ' ' -f 1)\"" > /etc/pgbouncer/userlist.txt
chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
chmod 640 /etc/pgbouncer/userlist.txt

# Start PgBouncer in the background
su - pgbouncer -c "/usr/sbin/pgbouncer -v /etc/pgbouncer/pgbouncer.ini" &

# Run the main command (postgres)
exec /usr/local/bin/docker-entrypoint.sh "$@"