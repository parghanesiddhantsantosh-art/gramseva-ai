#include <iostream>
#include <map>

using namespace std;

void mapping() {
    map<int, int> mpp;

    mpp[1] = 2;
    mpp.emplace(3, 2);
    mpp.insert({2, 4});

    mpp[3] = 10; // Overwrites the value at key 3 from 2 to 10

    for (auto it : mpp) {
        cout << it.first << " " << it.second << endl;
    }

    cout << mpp[3] << endl;
    cout << mpp[2] << endl;

    auto it = mpp.find(3);
    if (it != mpp.end()) {
        cout << it->second << endl; // Fixed: use it->second or (*it).second
    }
}

int main() {
    mapping();
    return 0;
}
