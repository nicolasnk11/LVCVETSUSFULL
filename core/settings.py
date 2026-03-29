

from pathlib import Path
import os
from pathlib import Path
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-x)y3=b^83evo0_zv&amg*ejeb&jms*f-9ibmr*&2tfvfdwi&m!'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # --- NOSSAS ADIÇÕES ---
    'django.contrib.gis',     
    'crispy_forms',            
    'crispy_bootstrap5',            
    'pacientes',                
    'rest_framework.authtoken',

    'rest_framework',   
    'rest_framework_gis',

]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(
        default='sqlite:///db.sqlite3',
        conn_max_age=600
    )
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'pt-br'

TIME_ZONE = 'America/Fortaleza'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')


# --- CONFIGURAÇÃO GEOGRÁFICA (WINDOWS - FINAL) ---
if os.name == 'nt':
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    # Caminho da pasta osgeo na venv
    VENV_BASE = os.path.join(BASE_DIR, 'venv', 'Lib', 'site-packages', 'osgeo')
    
    # 1. Configura a biblioteca PROJ (A CORREÇÃO DO SEU ERRO ESTÁ AQUI)
    # O arquivo proj.db fica dentro de osgeo/data/proj
    os.environ['PROJ_LIB'] = os.path.join(VENV_BASE, 'data', 'proj')
    
    # 2. Libera o acesso à DLL
    if hasattr(os, 'add_dll_directory'):
        os.add_dll_directory(VENV_BASE)
    
    # 3. Adiciona ao PATH
    os.environ['PATH'] = VENV_BASE + ";" + os.environ['PATH']
    
    # 4. Aponta para os arquivos
    GDAL_LIBRARY_PATH = os.path.join(VENV_BASE, 'gdal.dll')
    GEOS_LIBRARY_PATH = os.path.join(VENV_BASE, 'geos_c.dll')

    # --- CONFIGURAÇÃO DE CORS (Permitir acesso externo) ---
# Em produção, você colocaria apenas o domínio do seu site.
# Como é desenvolvimento, vamos liberar tudo para facilitar.
CORS_ALLOW_ALL_ORIGINS = True