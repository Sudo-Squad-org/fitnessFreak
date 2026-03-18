import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "postgresql://postgres:postgres@nutrition-db:5432/nutrition_db"

Base = declarative_base()


def get_engine(retries=10, delay=2):
    for i in range(retries):
        try:
            engine = create_engine(DATABASE_URL)
            with engine.connect():
                pass
            return engine
        except Exception as e:
            if i < retries - 1:
                time.sleep(delay)
            else:
                raise e


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
