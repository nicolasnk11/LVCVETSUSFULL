from rest_framework import viewsets
from .models import Proprietario, Pet, Visita, Medicacao, FotoEvolucao
from .serializers import ProprietarioSerializer, PetSerializer, VisitaSerializer, MedicacaoSerializer, FotoEvolucaoSerializer


class ProprietarioViewSet(viewsets.ModelViewSet):
    queryset = Proprietario.objects.all()
    serializer_class = ProprietarioSerializer

class PetViewSet(viewsets.ModelViewSet):
    queryset = Pet.objects.all()
    serializer_class = PetSerializer

class VisitaViewSet(viewsets.ModelViewSet):
    queryset = Visita.objects.all()
    serializer_class = VisitaSerializer

    # --- A MÁGICA ACONTECE AQUI ---
    def perform_create(self, serializer):
        # 1. Salva a visita normalmente
        visita = serializer.save()
        
        # 2. Pega o Pet dono dessa visita
        pet = visita.pet
        
        # 3. Verifica se deu Positivo em algum exame
        if visita.resultado_elisa == 'REAGENTE' or visita.resultado_dpp == 'REAGENTE':
            pet.status = 'POSITIVO'
            pet.save() # Atualiza o banco
            
        # 4. Se deu negativo e o pet estava suspeito, pode mudar para Negativo (Opcional)
        elif visita.resultado_elisa == 'NAO_REAGENTE' and visita.resultado_dpp == 'NAO_REAGENTE':
            if pet.status == 'SUSPEITO':
                pet.status = 'NEGATIVO'
                pet.save()

# Não esqueça de importar o model Medicacao e o MedicacaoSerializer no topo do arquivo!
class MedicacaoViewSet(viewsets.ModelViewSet):
    queryset = Medicacao.objects.all()
    serializer_class = MedicacaoSerializer

class FotoEvolucaoViewSet(viewsets.ModelViewSet):
    queryset = FotoEvolucao.objects.all()
    serializer_class = FotoEvolucaoSerializer