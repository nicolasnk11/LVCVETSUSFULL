from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
# IMPORTANTE: Adicionei PetViewSet na importação abaixo
from pacientes.views import ProprietarioViewSet, PetViewSet, VisitaViewSet, MedicacaoViewSet, FotoEvolucaoViewSet
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token

router = routers.DefaultRouter()
router.register(r'proprietarios', ProprietarioViewSet)
router.register(r'pets', PetViewSet) # <--- A LINHA MÁGICA QUE FALTAVA!
router.register(r'visitas', VisitaViewSet)
router.register(r'medicacoes', MedicacaoViewSet)
router.register(r'fotos-evolucao', FotoEvolucaoViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/login/', obtain_auth_token), # <--- A NOVA ROTA DE LOGIN REAL
]

# --- ADICIONAR ISSO NO FINAL ---
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)