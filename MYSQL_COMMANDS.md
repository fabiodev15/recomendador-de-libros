# Comandos útiles para MySQL en Docker

## 1. Conectarse a MySQL desde el contenedor
```bash
docker exec -it mysql_db mysql -u root -proot book_recommendation
```

## 2. Ver todas las tablas
```sql
SHOW TABLES;
```

## 3. Ver estructura de la tabla user
```sql
DESCRIBE user;
```

## 4. Ver todos los usuarios registrados
```sql
SELECT id, email, profile_data FROM user;
```

## 5. Ver las preferencias de usuarios
```sql
SELECT * FROM user_preferences;
```

## 6. Ver todas las interacciones
```sql
SELECT * FROM interaction;
```

## 7. Salir de MySQL
```sql
EXIT;
```

---

## Conectarse con MySQL Workbench o DBeaver
- **Host**: localhost
- **Puerto**: 3308 (¡OJO! No es 3306, cambiamos el puerto)
- **Usuario**: root
- **Contraseña**: root
- **Base de datos**: book_recommendation
