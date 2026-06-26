import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Branch

@csrf_exempt
def create_branch(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            branch_id = data.get('branch_id')
            name = data.get('name')
            password = data.get('password')
            
            if not branch_id or not name:
                return JsonResponse({'error': 'branch_id and name are required'}, status=400)
                
            branch = Branch.objects.create(branch_id=branch_id, name=name)
            if password:
                branch.set_password(password)
                branch.save()
                
            return JsonResponse({'status': 'success', 'branch_id': branch.branch_id})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def verify_branch(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            branch_id = data.get('branch_id')
            password = data.get('password')
            
            try:
                branch = Branch.objects.get(branch_id=branch_id)
                if branch.password and not branch.check_password(password):
                    return JsonResponse({'status': 'error', 'message': 'Invalid password'}, status=401)
                return JsonResponse({'status': 'success'})
            except Branch.DoesNotExist:
                return JsonResponse({'error': 'Branch not found'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def list_branches(request):
    if request.method == 'GET':
        branches = Branch.objects.all().values('branch_id', 'name', 'password')
        data = [{'id': b['branch_id'], 'name': b['name'], 'has_password': bool(b['password'])} for b in branches]
        return JsonResponse({'branches': data})
    return JsonResponse({'error': 'Method not allowed'}, status=405)
