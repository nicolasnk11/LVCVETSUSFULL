from rest_framework import serializers
from .models import Proprietario, Pet, Visita, Medicacao, FotoEvolucao

class VisitaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visita
        fields = '__all__'

class MedicacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicacao
        fields = '__all__'

# NOVO SERIALIZER PARA AS FOTOS
class FotoEvolucaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotoEvolucao
        fields = '__all__'

class PetSerializer(serializers.ModelSerializer):
    # Traz o histórico de visitas, medicações e galeria dentro do objeto Pet
    visitas = VisitaSerializer(many=True, read_only=True)
    medicacoes = MedicacaoSerializer(many=True, read_only=True)
    galeria = FotoEvolucaoSerializer(many=True, read_only=True)

    class Meta:
        model = Pet
        fields = '__all__'

class ProprietarioSerializer(serializers.ModelSerializer):
    pets = PetSerializer(many=True, read_only=True)

    class Meta:
        model = Proprietario
        fields = '__all__'