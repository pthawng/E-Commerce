1.  Lần đầu setup dùng lệnh 
        "docker compose -f docker-compose.dev.yaml up --build --watch"
    để build docker - đảm bảo có hot reload cho Nextjs và hot rebuild cho Nestjs

2. Sau khi setup buil lần đầu 
    a. Dev bình thường 
        docker compose -f docker-compose.dev.yaml up --watch

    b. Thay đổi Dockerfile hoặc dependency (VD: package.json, requirements.txt)
        docker compose -f docker-compose.dev.yaml up --build --watch

    c. Container đã tồn tại nhưng bị stop
        docker compose -f docker-compose.dev.yaml start
        
    d. Muốn xoá sạch môi trường và rebuild
        docker compose -f docker-compose.dev.yaml down -v && docker compose -f docker-compose.dev.yaml up --build --watch