#/bin/zsh

# docker run -p 5432:6432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword --rm pg-pool 
docker run -p 5432:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=mysecretpassword --rm pg-pool 