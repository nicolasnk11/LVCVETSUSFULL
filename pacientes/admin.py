from django.contrib.gis import admin
from .models import Proprietario, Pet

@admin.register(Proprietario)
class ProprietarioAdmin(admin.GISModelAdmin):
    # Isso cria um mapa interativo no admin para marcar a casa do tutor
    list_display = ('nome', 'telefone', 'endereco')
    search_fields = ('nome',)

@admin.register(Pet)
class PetAdmin(admin.ModelAdmin):
    list_display = ('nome', 'raca', 'status', 'proprietario')
    list_filter = ('status', 'sexo')
    search_fields = ('nome', 'proprietario__nome')