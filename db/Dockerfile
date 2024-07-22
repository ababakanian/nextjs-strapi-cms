# Use the official PostgreSQL image as base
FROM postgres:14

# Install pgbouncer and other necessary packages
RUN apt-get update && apt-get install -y pgbouncer

# Create a pgbouncer user and group with a home directory
RUN groupadd -r pgbouncer && useradd -r -g pgbouncer -d /home/pgbouncer -m pgbouncer

# Copy configuration files
COPY pgbouncer.ini /etc/pgbouncer/pgbouncer.ini

# Set correct permissions
RUN chown pgbouncer:pgbouncer /etc/pgbouncer/pgbouncer.ini && \
    chmod 640 /etc/pgbouncer/pgbouncer.ini

# Create directory for PgBouncer logs and set permissions
RUN mkdir -p /var/log/postgresql && \
    chown pgbouncer:pgbouncer /var/log/postgresql && \
    chmod 755 /var/log/postgresql

# Create directory for PgBouncer pid file and set permissions
RUN mkdir -p /var/run/pgbouncer && \
    chown pgbouncer:pgbouncer /var/run/pgbouncer && \
    chmod 755 /var/run/pgbouncer

RUN chmod 777 /var/run/postgresql/
RUN chown pgbouncer:pgbouncer /var/run/postgresql/

# Expose PostgreSQL and PgBouncer ports
# EXPOSE 5432 6432
EXPOSE 5432

# Debug: Print permissions
# RUN ls -la /var/run/pgbouncer /var/log/postgresql /etc/pgbouncer

# Copy the entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Modify PostgreSQL configuration to use port 5433
RUN sed -i 's/^#port = 5432/port = 6432/' /usr/share/postgresql/postgresql.conf.sample

# Set the entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]

# Command to run
CMD ["postgres"]

# Start PostgreSQL and PgBouncer
# CMD postgres && su - pgbouncer -c "/usr/sbin/pgbouncer /etc/pgbouncer/pgbouncer.ini"

# CMD service postgresql start && \
#     su - pgbouncer -c "/usr/sbin/pgbouncer /etc/pgbouncer/pgbouncer.ini"

# CMD service postgresql start && \
#     su - pgbouncer -c "/usr/sbin/pgbouncer /opt/pgbouncer/share/doc/pgbouncer/pgbouncer.ini"
